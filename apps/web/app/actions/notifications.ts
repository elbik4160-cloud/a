"use server"

import { db } from "@crm/db"
import { notifications } from "@crm/db"
import { requireUser } from "@crm/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/** Internal helper used by other actions to push a notification. */
export async function createNotification(input: {
  userId: string
  title: string
  titleAr: string
  body: string
  bodyAr: string
  type: string
  refId?: string
}) {
  await db.insert(notifications).values(input)
}

export async function getMyNotifications() {
  const me = await requireUser()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.isRead), desc(notifications.createdAt))
    .limit(30)
}

export async function getUnreadCount() {
  const me = await requireUser()
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, me.id), eq(notifications.isRead, false)))
  return rows.length
}

export async function markNotificationRead(id: number) {
  const me = await requireUser()
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, me.id)))
  revalidatePath("/", "layout")
}

export async function markAllNotificationsRead() {
  const me = await requireUser()
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, me.id))
  revalidatePath("/", "layout")
}
