"use server"

import { db } from "@crm/db"
import { resaleListings, user as userTable } from "@crm/db"
import { requireApprovedUser, requireAdmin } from "@crm/auth/session"
import { encrypt, decrypt } from "@crm/shared-lib"
import { hasPermission, logAudit } from "@crm/shared-lib/server"
import { createNotification } from "@/app/actions/notifications"
import { and, desc, eq, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const MASK = "████"

export type ResaleView = {
  id: number
  projectName: string
  unitType: string
  floor: number | null
  area: string | null
  price: string | null
  finishing: string | null
  description: string | null
  images: string[]
  status: string
  assignedToId: string | null
  assignedToName: string | null
  uploadedByName: string | null
  createdAt: Date
  // owner data — decrypted only when authorized, else masked
  ownerName: string
  ownerPhone: string
  ownerId: string
  canSeeOwner: boolean
}

function parseImages(raw: string | null): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function toView(row: typeof resaleListings.$inferSelect, canSeeOwner: boolean, canSeePrice: boolean): ResaleView {
  return {
    id: row.id,
    projectName: row.projectName,
    unitType: row.unitType,
    floor: row.floor,
    area: row.area,
    price: canSeePrice ? row.price : MASK,
    finishing: row.finishing,
    description: row.description,
    images: parseImages(row.images),
    status: row.status,
    assignedToId: row.assignedToId,
    assignedToName: row.assignedToName,
    uploadedByName: row.uploadedByName,
    createdAt: row.createdAt,
    ownerName: canSeeOwner ? decrypt(row.ownerNameEnc) : MASK,
    ownerPhone: canSeeOwner ? decrypt(row.ownerPhoneEnc) : MASK,
    ownerId: canSeeOwner ? decrypt(row.ownerIdEnc) : MASK,
    canSeeOwner,
  }
}

/** Admin: all listings (owner data visible). Sales: assigned + masked others. */
export async function getResaleListings(): Promise<ResaleView[]> {
  const me = await requireApprovedUser()
  if (me.role === "admin") {
    const rows = await db.select().from(resaleListings).orderBy(desc(resaleListings.createdAt))
    return rows.map((r) => toView(r, true, true))
  }
  const canSeePrice = await hasPermission(me.id, me.role, "view_price")
  const rows = await db
    .select()
    .from(resaleListings)
    .where(
      or(
        eq(resaleListings.assignedToId, me.id),
        eq(resaleListings.status, "Active"),
      ),
    )
    .orderBy(desc(resaleListings.createdAt))
  return rows.map((r) => {
    const mine = r.assignedToId === me.id && r.status === "Assigned"
    return toView(r, mine, canSeePrice)
  })
}

export async function addResaleListing(input: {
  projectName: string
  unitType: string
  floor?: string
  area?: string
  price?: string
  finishing?: string
  description?: string
  image?: string
  ownerName: string
  ownerPhone: string
  ownerNationalId?: string
}) {
  const me = await requireAdmin()
  if (!input.projectName?.trim() || !input.unitType?.trim()) {
    return { ok: false, error: "اسم المشروع ونوع الوحدة مطلوبان / Project and unit type are required" }
  }
  if (!input.ownerName?.trim() || !input.ownerPhone?.trim()) {
    return { ok: false, error: "بيانات المالك مطلوبة / Owner data is required" }
  }

  // Store the optional photo as a JSON array of image sources (data URL).
  const img = input.image?.trim()
  if (img && img.length > 4_000_000) {
    return { ok: false, error: "حجم الصورة كبير جداً / Image is too large" }
  }
  const imagesJson = img ? JSON.stringify([img]) : null

  const [row] = await db
    .insert(resaleListings)
    .values({
      projectName: input.projectName.trim(),
      unitType: input.unitType.trim(),
      floor: input.floor ? Number.parseInt(input.floor, 10) || null : null,
      area: input.area?.trim() || null,
      price: input.price?.trim() || null,
      finishing: input.finishing?.trim() || null,
      description: input.description?.trim() || null,
      images: imagesJson,
      ownerNameEnc: encrypt(input.ownerName.trim()),
      ownerPhoneEnc: encrypt(input.ownerPhone.trim()),
      ownerIdEnc: input.ownerNationalId?.trim() ? encrypt(input.ownerNationalId.trim()) : null,
      status: "Active",
      uploadedById: me.id,
      uploadedByName: me.name,
    })
    .returning()

  await logAudit({ userId: me.id, userName: me.name, action: "ADD_RESALE", entity: "ResaleListing", entityId: String(row.id) })
  revalidatePath("/resale")
  revalidatePath("/resale-market")
  return { ok: true }
}

export async function assignResale(input: { resaleId: number; assignedToId: string | null }) {
  const me = await requireAdmin()
  const updates: Partial<typeof resaleListings.$inferSelect> = {
    assignedToId: input.assignedToId,
    assignedAt: input.assignedToId ? new Date() : null,
    status: input.assignedToId ? "Assigned" : "Active",
    updatedAt: new Date(),
  }
  let assigneeName: string | null = null
  if (input.assignedToId) {
    const u = await db.select().from(userTable).where(eq(userTable.id, input.assignedToId)).limit(1)
    assigneeName = u[0]?.name ?? null
  }
  updates.assignedToName = assigneeName

  const [row] = await db
    .update(resaleListings)
    .set(updates)
    .where(eq(resaleListings.id, input.resaleId))
    .returning()

  if (input.assignedToId && row) {
    await createNotification({
      userId: input.assignedToId,
      title: "New resale unit",
      titleAr: "وحدة إعادة بيع جديدة",
      body: `You have been assigned: ${row.projectName}`,
      bodyAr: `تم تكليفك بوحدة: ${row.projectName}`,
      type: "resale_assigned",
      refId: String(row.id),
    })
  }
  await logAudit({ userId: me.id, userName: me.name, action: "ASSIGN_RESALE", entity: "ResaleListing", entityId: String(input.resaleId) })
  revalidatePath("/resale")
  revalidatePath("/resale-market")
  return { ok: true }
}

export async function setResaleStatus(input: { resaleId: number; status: string }) {
  const me = await requireAdmin()
  await db
    .update(resaleListings)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(resaleListings.id, input.resaleId))
  revalidatePath("/resale")
  revalidatePath("/resale-market")
  return { ok: true }
}

export async function deleteResale(resaleId: number) {
  const me = await requireAdmin()
  await db.delete(resaleListings).where(eq(resaleListings.id, resaleId))
  await logAudit({ userId: me.id, userName: me.name, action: "DELETE_RESALE", entity: "ResaleListing", entityId: String(resaleId) })
  revalidatePath("/resale")
  revalidatePath("/resale-market")
  return { ok: true }
}
