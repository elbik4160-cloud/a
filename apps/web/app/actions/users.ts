"use server"

import { db } from "@crm/db"
import { user as userTable, feedback, clients } from "@crm/db"
import { requireAdmin } from "@crm/auth/session"
import { desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getPendingUsers() {
  await requireAdmin()
  return db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      requestedRole: userTable.requestedRole,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.status, "pending"))
    .orderBy(desc(userTable.createdAt))
}

export async function getAllUsers() {
  const admin = await requireAdmin()
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      status: userTable.status,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt))

  // Attach per-user stats
  const result = []
  for (const u of rows) {
    const [fb] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedback)
      .where(eq(feedback.salesUserId, u.id))
    const [cl] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(eq(clients.createdBy, u.id))
    result.push({
      ...u,
      isSelf: u.id === admin.id,
      feedbackCount: Number(fb?.count ?? 0),
      clientCount: Number(cl?.count ?? 0),
    })
  }
  return result
}

export async function approveUser(userId: string, role: "sales" | "admin") {
  await requireAdmin()
  await db.update(userTable).set({ status: "approved", role, updatedAt: new Date() }).where(eq(userTable.id, userId))
  revalidatePath("/admin/approvals")
  revalidatePath("/admin/users")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function rejectUser(userId: string) {
  await requireAdmin()
  await db.update(userTable).set({ status: "rejected", updatedAt: new Date() }).where(eq(userTable.id, userId))
  revalidatePath("/admin/approvals")
  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserRole(userId: string, role: "sales" | "admin") {
  const admin = await requireAdmin()
  if (userId === admin.id) return { error: "لا يمكنك تغيير دورك الخاص" }
  await db.update(userTable).set({ role, updatedAt: new Date() }).where(eq(userTable.id, userId))
  revalidatePath("/admin/users")
  return { success: true }
}

export async function setUserStatus(userId: string, status: "approved" | "rejected") {
  const admin = await requireAdmin()
  if (userId === admin.id) return { error: "لا يمكنك تغيير حالتك الخاصة" }
  await db.update(userTable).set({ status, updatedAt: new Date() }).where(eq(userTable.id, userId))
  revalidatePath("/admin/users")
  return { success: true }
}
