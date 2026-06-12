"use server"

import { db } from "@crm/db"
import { clients, clientQueue, clientLocks, feedback } from "@crm/db"
import { requireApprovedUser } from "@crm/auth/session"
import { desc, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function genClientId() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CL-${ts}-${rand}`
}

export type ClientWithMeta = {
  id: number
  clientId: string
  name: string
  countryCode: string | null
  phone: string | null
  countryCode2: string | null
  phone2: string | null
  request: string | null
  notes: string | null
  chooseSales: string | null
  createdBy: string
  createdByName: string | null
  createdAt: Date
  feedbackCount: number
  lastStatus: string | null
}

export async function getClients(search?: string): Promise<ClientWithMeta[]> {
  const user = await requireApprovedUser()

  const whereClause = search
    ? or(
        ilike(clients.name, `%${search}%`),
        ilike(clients.phone, `%${search}%`),
        ilike(clients.clientId, `%${search}%`),
        ilike(clients.request, `%${search}%`),
      )
    : undefined

  // Sales reps only see clients assigned to them (via chooseSales) or created by them.
  const rows = await db.select().from(clients).where(whereClause).orderBy(desc(clients.createdAt))

  const visible = rows.filter((c) => {
    if (user.role === "admin") return true
    const assigned = (c.chooseSales ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    return assigned.includes(user.email.toLowerCase()) || c.createdBy === user.id
  })

  const result: ClientWithMeta[] = []
  for (const c of visible) {
    const fbs = await db
      .select()
      .from(feedback)
      .where(eq(feedback.clientId, c.clientId))
      .orderBy(desc(feedback.createdAt))
    result.push({
      ...c,
      feedbackCount: fbs.length,
      lastStatus: fbs[0]?.clientStatus ?? null,
    })
  }
  return result
}

export async function getClientById(clientId: string) {
  await requireApprovedUser()
  const rows = await db.select().from(clients).where(eq(clients.clientId, clientId)).limit(1)
  return rows[0] ?? null
}

export async function createClient(input: {
  name: string
  countryCode?: string
  phone?: string
  countryCode2?: string
  phone2?: string
  request?: string
  notes?: string
  chooseSales?: string
}) {
  const user = await requireApprovedUser()

  if (!input.name?.trim()) {
    return { error: "اسم العميل مطلوب" }
  }

  const clientId = genClientId()
  await db.insert(clients).values({
    clientId,
    name: input.name.trim(),
    countryCode: input.countryCode || null,
    phone: input.phone || null,
    countryCode2: input.countryCode2 || null,
    phone2: input.phone2 || null,
    request: input.request || null,
    notes: input.notes || null,
    chooseSales: input.chooseSales || null,
    createdBy: user.id,
    createdByName: user.name,
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true, clientId }
}

export async function updateClient(
  clientId: string,
  input: {
    name?: string
    countryCode?: string
    phone?: string
    countryCode2?: string
    phone2?: string
    request?: string
    notes?: string
    chooseSales?: string
  },
) {
  const user = await requireApprovedUser()
  const existing = await getClientById(clientId)
  if (!existing) return { error: "العميل غير موجود" }
  if (user.role !== "admin" && existing.createdBy !== user.id) {
    return { error: "لا تملك صلاحية تعديل هذا العميل" }
  }

  await db
    .update(clients)
    .set({
      name: input.name?.trim() || existing.name,
      countryCode: input.countryCode ?? existing.countryCode,
      phone: input.phone ?? existing.phone,
      countryCode2: input.countryCode2 ?? existing.countryCode2,
      phone2: input.phone2 ?? existing.phone2,
      request: input.request ?? existing.request,
      notes: input.notes ?? existing.notes,
      chooseSales: input.chooseSales ?? existing.chooseSales,
    })
    .where(eq(clients.clientId, clientId))

  revalidatePath("/clients")
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const user = await requireApprovedUser()
  if (user.role !== "admin") return { error: "للمدير فقط" }

  await db.delete(clients).where(eq(clients.clientId, clientId))
  await db.delete(clientQueue).where(eq(clientQueue.clientId, clientId))
  await db.delete(clientLocks).where(eq(clientLocks.clientId, clientId))
  await db.delete(feedback).where(eq(feedback.clientId, clientId))

  revalidatePath("/clients")
  return { success: true }
}
