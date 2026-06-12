"use server"

import { db } from "@crm/db"
import { leads, leadActivities, leadDelays, user as userTable } from "@crm/db"
import { requireApprovedUser, requireAdmin } from "@crm/auth/session"
import { getUserPermissions, logAudit } from "@crm/shared-lib/server"
import { createNotification } from "@/app/actions/notifications"
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const MASK = "••••••"

/** Apply per-permission field masking to a lead for a sales viewer. */
function maskLead(lead: typeof leads.$inferSelect, perms: Set<string>) {
  return {
    ...lead,
    phone: perms.has("view_phone") ? lead.phone : MASK,
    phone2: perms.has("view_phone2") ? lead.phone2 : lead.phone2 ? MASK : lead.phone2,
    notes: perms.has("view_notes") ? lead.notes : lead.notes ? MASK : lead.notes,
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Admin: every lead, newest first. */
export async function getAllLeads() {
  await requireAdmin()
  return db.select().from(leads).orderBy(desc(leads.createdAt))
}

/** Admin: leads with no owner yet (the assignment pool). */
export async function getUnassignedLeads() {
  await requireAdmin()
  return db
    .select()
    .from(leads)
    .where(isNull(leads.assignedToId))
    .orderBy(asc(leads.createdAt))
}

/** Sales: only my leads. Admin sees their own assigned leads here too. */
export async function getMyLeads() {
  const me = await requireApprovedUser()
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.assignedToId, me.id))
    .orderBy(desc(leads.statusChangedAt))
  if (me.role === "admin") return rows
  const perms = await getUserPermissions(me.id, me.role)
  return rows.map((l) => maskLead(l, perms))
}

/** Approved members list, used to populate the "assign to" dropdown. */
export async function getSalesMembers() {
  await requireAdmin()
  return db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.status, "approved"))
    .orderBy(asc(userTable.name))
}

/** Full detail for a single lead: the lead, its activity timeline, active delay. */
export async function getLeadDetail(leadId: number) {
  const me = await requireApprovedUser()
  const rows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  const lead = rows[0]
  if (!lead) throw new Error("Lead not found")
  // Sales can only read their own leads; admins can read any.
  if (me.role !== "admin" && lead.assignedToId !== me.id) {
    throw new Error("Forbidden")
  }
  const activities = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt))
  const delays = await db
    .select()
    .from(leadDelays)
    .where(and(eq(leadDelays.leadId, leadId), isNull(leadDelays.cancelledAt)))
    .orderBy(desc(leadDelays.createdAt))
    .limit(1)
  return { lead, activities, activeDelay: delays[0] ?? null }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

type LeadInput = {
  name: string
  phone: string
  phone2?: string
  project?: string
  unitType?: string
  budget?: string
  area?: string
  source?: string
  notes?: string
}

export async function createLead(input: LeadInput) {
  const me = await requireApprovedUser()
  const name = input.name?.trim()
  const phone = input.phone?.trim()
  if (!name) return { error: "الاسم مطلوب / Name is required" }
  if (!phone) return { error: "رقم الهاتف مطلوب / Phone is required" }

  // Enforce phone uniqueness with a friendly message instead of a raw 500.
  const existing = await db.select({ id: leads.id }).from(leads).where(eq(leads.phone, phone)).limit(1)
  if (existing[0]) return { error: "رقم الهاتف مسجل بالفعل / Phone already exists" }

  await db.insert(leads).values({
    name,
    phone,
    phone2: input.phone2?.trim() || null,
    project: input.project?.trim() || null,
    unitType: input.unitType?.trim() || null,
    budget: input.budget?.trim() || null,
    area: input.area?.trim() || null,
    source: input.source || "Other",
    notes: input.notes?.trim() || null,
    status: "New",
    createdById: me.id,
    createdByName: me.name,
  })
  await logAudit({ userId: me.id, userName: me.name, action: "ADD_LEAD", entity: "Lead", details: name })
  revalidatePath("/leads")
  revalidatePath("/pipeline")
  return { success: true }
}

/** Admin: bulk import leads from parsed CSV rows. Skips duplicates by phone. */
export async function importLeads(rows: LeadInput[]) {
  const me = await requireAdmin()
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "لا توجد بيانات / No rows found" }
  }
  if (rows.length > 2000) {
    return { error: "الحد الأقصى 2000 صف / Max 2000 rows" }
  }

  // Existing phones to skip duplicates.
  const existing = await db.select({ phone: leads.phone }).from(leads)
  const seen = new Set(existing.map((e) => e.phone))

  let imported = 0
  let skipped = 0
  const toInsert: (typeof leads.$inferInsert)[] = []
  for (const r of rows) {
    const name = r.name?.trim()
    const phone = r.phone?.trim()
    if (!name || !phone || seen.has(phone)) {
      skipped++
      continue
    }
    seen.add(phone)
    toInsert.push({
      name,
      phone,
      phone2: r.phone2?.trim() || null,
      project: r.project?.trim() || null,
      unitType: r.unitType?.trim() || null,
      budget: r.budget?.trim() || null,
      area: r.area?.trim() || null,
      source: r.source?.trim() || "Import",
      notes: r.notes?.trim() || null,
      status: "New",
      createdById: me.id,
      createdByName: me.name,
    })
    imported++
  }

  if (toInsert.length > 0) {
    // Insert in chunks to keep statements reasonable.
    for (let i = 0; i < toInsert.length; i += 200) {
      await db.insert(leads).values(toInsert.slice(i, i + 200))
    }
  }

  await logAudit({
    userId: me.id,
    userName: me.name,
    action: "IMPORT_LEADS",
    entity: "Lead",
    details: `imported=${imported} skipped=${skipped}`,
  })
  revalidatePath("/leads")
  revalidatePath("/pipeline")
  return { success: true, imported, skipped }
}

/** Admin assigns (or reassigns) a lead to a sales member. */
export async function assignLead(leadId: number, salesUserId: string) {
  const me = await requireAdmin()
  const rows = await db
    .select({ id: userTable.id, name: userTable.name, status: userTable.status })
    .from(userTable)
    .where(eq(userTable.id, salesUserId))
    .limit(1)
  const target = rows[0]
  if (!target || target.status !== "approved") {
    return { error: "العضو غير صالح / Invalid member" }
  }
  const [updated] = await db
    .update(leads)
    .set({ assignedToId: target.id, assignedToName: target.name, assignedAt: new Date(), status: "Assigned" })
    .where(eq(leads.id, leadId))
    .returning()
  await createNotification({
    userId: target.id,
    title: "New lead assigned",
    titleAr: "تم تكليفك بعميل",
    body: `You have been assigned: ${updated?.name ?? ""}`,
    bodyAr: `تم تكليفك بعميل: ${updated?.name ?? ""}`,
    type: "assignment",
    refId: String(leadId),
  })
  await logAudit({ userId: me.id, userName: me.name, action: "ASSIGN_LEAD", entity: "Lead", entityId: String(leadId) })
  revalidatePath("/leads")
  revalidatePath("/pipeline")
  return { success: true }
}

/**
 * Smart assign: distributes all unassigned leads evenly across approved
 * sales members (round-robin by current load, fewest leads first).
 */
export async function smartAssignLeads() {
  await requireAdmin()
  const pool = await db.select({ id: leads.id }).from(leads).where(isNull(leads.assignedToId))
  if (pool.length === 0) return { error: "لا يوجد عملاء غير معينين / No unassigned leads" }

  const members = await db
    .select({ id: userTable.id, name: userTable.name })
    .from(userTable)
    .where(and(eq(userTable.status, "approved"), eq(userTable.role, "sales")))
  if (members.length === 0) return { error: "لا يوجد مندوبين / No sales members" }

  // Current load per member.
  const loads = await db
    .select({ assignedToId: leads.assignedToId, c: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.assignedToId)
  const loadMap = new Map<string, number>()
  for (const m of members) loadMap.set(m.id, 0)
  for (const l of loads) {
    if (l.assignedToId && loadMap.has(l.assignedToId)) loadMap.set(l.assignedToId, Number(l.c))
  }

  // Batch assignment: group leads by assigned member to avoid N+1 updates
  const now = new Date()
  const assignmentsByMember = new Map<string, number[]>()
  
  for (const lead of pool) {
    // Pick the member with the smallest current load.
    let best = members[0]
    let bestLoad = loadMap.get(best.id) ?? 0
    for (const m of members) {
      const load = loadMap.get(m.id) ?? 0
      if (load < bestLoad) {
        best = m
        bestLoad = load
      }
    }
    
    if (!assignmentsByMember.has(best.id)) {
      assignmentsByMember.set(best.id, [])
    }
    assignmentsByMember.get(best.id)!.push(lead.id)
    loadMap.set(best.id, bestLoad + 1)
  }

  // Execute batch updates
  for (const [memberId, leadIds] of assignmentsByMember) {
    const memberName = members.find(m => m.id === memberId)?.name ?? ""
    await db
      .update(leads)
      .set({ assignedToId: memberId, assignedToName: memberName, assignedAt: now })
      .where(sql`${leads.id} = ANY(${leadIds}::int[])`)
  }
  
  revalidatePath("/leads")
  revalidatePath("/pipeline")
  return { success: true, assigned: pool.length }
}

/** Move a lead to a new pipeline stage (drag-and-drop on the board). */
export async function updateLeadStatus(leadId: number, status: string) {
  const me = await requireApprovedUser()
  const rows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  const lead = rows[0]
  if (!lead) return { error: "Lead not found" }
  if (me.role !== "admin" && lead.assignedToId !== me.id) {
    return { error: "غير مصرح / Not allowed" }
  }
  await db
    .update(leads)
    .set({ status, statusChangedAt: new Date() })
    .where(eq(leads.id, leadId))
  revalidatePath("/pipeline")
  revalidatePath("/leads")
  return { success: true }
}

export async function deleteLead(leadId: number) {
  const me = await requireAdmin()
  await db.delete(leadActivities).where(eq(leadActivities.leadId, leadId))
  await db.delete(leadDelays).where(eq(leadDelays.leadId, leadId))
  await db.delete(leads).where(eq(leads.id, leadId))
  await logAudit({ userId: me.id, userName: me.name, action: "DELETE_LEAD", entity: "Lead", entityId: String(leadId) })
  revalidatePath("/leads")
  revalidatePath("/pipeline")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Activities & delays
// ---------------------------------------------------------------------------

type ActivityInput = {
  leadId: number
  type: string
  notes?: string
  outcome?: string
  nextAction?: string
  followUpAt?: string | null
  durationMin?: number | null
}

export async function logActivity(input: ActivityInput) {
  const me = await requireApprovedUser()
  const rows = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1)
  const lead = rows[0]
  if (!lead) return { error: "Lead not found" }
  if (me.role !== "admin" && lead.assignedToId !== me.id) {
    return { error: "غير مصرح / Not allowed" }
  }
  await db.insert(leadActivities).values({
    leadId: input.leadId,
    userId: me.id,
    userName: me.name,
    type: input.type,
    notes: input.notes?.trim() || null,
    outcome: input.outcome?.trim() || null,
    nextAction: input.nextAction?.trim() || null,
    followUpAt: input.followUpAt ? new Date(input.followUpAt) : null,
    durationMin: input.durationMin ?? null,
  })
  revalidatePath("/pipeline")
  revalidatePath("/leads")
  return { success: true }
}

export async function startDelay(input: {
  leadId: number
  reason: string
  reasonNote?: string
  resumeAt: string
}) {
  const me = await requireApprovedUser()
  const rows = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1)
  const lead = rows[0]
  if (!lead) return { error: "Lead not found" }
  if (me.role !== "admin" && lead.assignedToId !== me.id) {
    return { error: "غير مصرح / Not allowed" }
  }
  // Cancel any existing active delay before creating a new one.
  await db
    .update(leadDelays)
    .set({ cancelledAt: new Date() })
    .where(and(eq(leadDelays.leadId, input.leadId), isNull(leadDelays.cancelledAt)))
  await db.insert(leadDelays).values({
    leadId: input.leadId,
    userId: me.id,
    reason: input.reason,
    reasonNote: input.reasonNote?.trim() || null,
    resumeAt: new Date(input.resumeAt),
  })
  revalidatePath("/pipeline")
  revalidatePath("/leads")
  return { success: true }
}

export async function cancelDelay(leadId: number) {
  const me = await requireApprovedUser()
  await db
    .update(leadDelays)
    .set({ cancelledAt: new Date() })
    .where(and(eq(leadDelays.leadId, leadId), isNull(leadDelays.cancelledAt)))
  revalidatePath("/pipeline")
  revalidatePath("/leads")
  return { success: true }
}
