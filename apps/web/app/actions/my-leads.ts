"use server"

import { db } from "@crm/db"
import { leads, leadActivities, leadDelays, salesTargets } from "@crm/db"
import { requireApprovedUser } from "@crm/auth/session"
import { getUserPermissions } from "@crm/shared-lib/server"
import { computeLeadMeta, setPriorityMarker, type LeadMeta } from "@crm/shared-lib"
import { and, desc, eq, gte, inArray, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { Lead, LeadActivity } from "@crm/db"

const MASK = "••••••"

export type EnrichedLead = Lead & { meta: LeadMeta; lastActivity: LeadActivity | null }

/** Returns the current sales member's leads, enriched with score/meta, sorted by urgency. */
export async function getMyLeadsEnriched(): Promise<EnrichedLead[]> {
  const me = await requireApprovedUser()
  const myLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.assignedToId, me.id))
    .orderBy(desc(leads.statusChangedAt))

  if (myLeads.length === 0) return []

  const ids = myLeads.map((l) => l.id)
  const acts = await db
    .select()
    .from(leadActivities)
    .where(inArray(leadActivities.leadId, ids))
    .orderBy(desc(leadActivities.createdAt))
  const activeDelays = await db
    .select()
    .from(leadDelays)
    .where(and(inArray(leadDelays.leadId, ids), isNull(leadDelays.cancelledAt)))

  const actsByLead = new Map<number, LeadActivity[]>()
  for (const a of acts) {
    const list = actsByLead.get(a.leadId) ?? []
    list.push(a)
    actsByLead.set(a.leadId, list)
  }
  const delayByLead = new Map<number, (typeof activeDelays)[number]>()
  for (const d of activeDelays) delayByLead.set(d.leadId, d)

  const perms = me.role === "admin" ? null : await getUserPermissions(me.id, me.role)

  const enriched = myLeads.map((lead) => {
    const leadActs = actsByLead.get(lead.id) ?? []
    const meta = computeLeadMeta(lead, leadActs, delayByLead.get(lead.id) ?? null)
    const masked =
      perms == null
        ? lead
        : {
            ...lead,
            phone: perms.has("view_phone") ? lead.phone : MASK,
            phone2: perms.has("view_phone2") ? lead.phone2 : lead.phone2 ? MASK : lead.phone2,
            notes: perms.has("view_notes") ? lead.notes : lead.notes ? MASK : lead.notes,
          }
    return { ...masked, meta, lastActivity: leadActs[0] ?? null }
  })

  // Sort by urgency rank, then score desc.
  enriched.sort((a, b) => a.meta.urgencyRank - b.meta.urgencyRank || b.meta.score - a.meta.score)
  return enriched
}

/** Swipe up → mark a lead High priority (stored as a marker in notes). */
export async function markLeadHot(leadId: number) {
  const me = await requireApprovedUser()
  const rows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  const lead = rows[0]
  if (!lead) return { error: "Lead not found" }
  if (me.role !== "admin" && lead.assignedToId !== me.id) return { error: "غير مصرح / Not allowed" }
  await db
    .update(leads)
    .set({ notes: setPriorityMarker(lead.notes, "High") })
    .where(eq(leads.id, leadId))
  revalidatePath("/my-leads")
  return { success: true }
}

export type MissionData = {
  periodMonth: string
  workingDaysInMonth: number
  // Daily targets (monthly target / working days, rounded up)
  daily: { calls: number; whatsapp: number; meetings: number }
  // Today's actuals
  today: { calls: number; whatsapp: number; meetings: number }
  // Monthly progress
  monthly: {
    calls: { actual: number; target: number }
    whatsapp: { actual: number; target: number }
    meetings: { actual: number; target: number }
    deals: { actual: number; target: number }
  }
}

function workingDaysInMonth(year: number, month: number): number {
  let count = 0
  const days = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const wd = new Date(year, month, d).getDay()
    if (wd !== 5) count++ // treat Friday as the weekend day
  }
  return count
}

/** Daily mission + monthly target progress for the current sales member. */
export async function getMyMission(): Promise<MissionData> {
  const me = await requireApprovedUser()
  const now = new Date()
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const targetRows = await db
    .select()
    .from(salesTargets)
    .where(and(eq(salesTargets.userId, me.id), eq(salesTargets.periodMonth, periodMonth)))
    .limit(1)
  const target = targetRows[0]
  const callsTarget = target?.callsTarget ?? 100
  const whatsappTarget = target?.whatsappTarget ?? 60
  const meetingsTarget = target?.meetingsTarget ?? 20
  const dealsTarget = target?.dealsTarget ?? 8

  const wd = workingDaysInMonth(now.getFullYear(), now.getMonth())

  // Month activities for this user
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const myMonthActs = await db
    .select()
    .from(leadActivities)
    .where(and(eq(leadActivities.userId, me.id), gte(leadActivities.createdAt, monthStart)))

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let mCalls = 0,
    mWa = 0,
    mMeet = 0
  let tCalls = 0,
    tWa = 0,
    tMeet = 0
  for (const a of myMonthActs) {
    const isToday = new Date(a.createdAt) >= todayStart
    if (a.type === "Call") {
      mCalls++
      if (isToday) tCalls++
    } else if (a.type === "WhatsApp") {
      mWa++
      if (isToday) tWa++
    } else if (a.type === "Meeting" || a.type === "SiteVisit") {
      mMeet++
      if (isToday) tMeet++
    }
  }

  // Deals won this month (status Won, changed this month)
  const wonRows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.assignedToId, me.id), eq(leads.status, "Won"), gte(leads.statusChangedAt, monthStart)))

  return {
    periodMonth,
    workingDaysInMonth: wd,
    daily: {
      calls: Math.ceil(callsTarget / wd),
      whatsapp: Math.ceil(whatsappTarget / wd),
      meetings: Math.ceil(meetingsTarget / wd),
    },
    today: { calls: tCalls, whatsapp: tWa, meetings: tMeet },
    monthly: {
      calls: { actual: mCalls, target: callsTarget },
      whatsapp: { actual: mWa, target: whatsappTarget },
      meetings: { actual: mMeet, target: meetingsTarget },
      deals: { actual: wonRows.length, target: dealsTarget },
    },
  }
}

export type Nudge = {
  id: string
  icon: string
  message: string
  messageAr: string
  action: string | null
  actionAr: string | null
  leadId: number | null
  tone: "warn" | "info" | "success"
}

/** Generates client-relevant smart nudges based on the member's leads + time of day. */
export async function getMyNudges(): Promise<Nudge[]> {
  const enriched = await getMyLeadsEnriched()
  const nudges: Nudge[] = []
  const now = new Date()

  const overdue = enriched.filter((l) => l.meta.isOverdue)
  if (overdue.length > 0) {
    nudges.push({
      id: "overdue",
      icon: "clock",
      message: `You have ${overdue.length} overdue follow-up${overdue.length > 1 ? "s" : ""}`,
      messageAr: `لديك ${overdue.length} متابعة متأخرة`,
      action: "View",
      actionAr: "عرض",
      leadId: overdue[0].id,
      tone: "warn",
    })
  }

  // Negotiation lead silent 3+ days
  const coldNeg = enriched.find(
    (l) =>
      l.status === "Negotiation" &&
      l.meta.lastActivityAt &&
      (now.getTime() - new Date(l.meta.lastActivityAt).getTime()) / 86_400_000 >= 3,
  )
  if (coldNeg) {
    nudges.push({
      id: `cold-${coldNeg.id}`,
      icon: "flame",
      message: `${coldNeg.name} is getting cold — silent for 3+ days. Call now?`,
      messageAr: `${coldNeg.name} يبرد — صامت منذ ٣ أيام. اتصل الآن؟`,
      action: "Call Now",
      actionAr: "اتصل الآن",
      leadId: coldNeg.id,
      tone: "warn",
    })
  }

  // 5pm and no calls logged today
  const mission = await getMyMission()
  if (now.getHours() >= 17 && mission.today.calls === 0) {
    nudges.push({
      id: "eod-nocalls",
      icon: "phone",
      message: "End of day — you haven't logged any calls today",
      messageAr: "نهاية اليوم — لم تسجل أي مكالمات اليوم",
      action: "Log now",
      actionAr: "سجّل الآن",
      leadId: enriched[0]?.id ?? null,
      tone: "info",
    })
  }

  // Hot leads
  const hot = enriched.find((l) => l.meta.isHot)
  if (hot) {
    nudges.push({
      id: `hot-${hot.id}`,
      icon: "flame",
      message: `Hot lead — ${hot.name}, ${hot.budget ?? "budget n/a"}`,
      messageAr: `عميل ساخن — ${hot.name}، ${hot.budget ?? "بدون ميزانية"}`,
      action: "View Card",
      actionAr: "عرض البطاقة",
      leadId: hot.id,
      tone: "success",
    })
  }

  return nudges
}
