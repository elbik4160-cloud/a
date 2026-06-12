"use server"

import { db } from "@crm/db"
import { chatMessages, chatPermissions, user as userTable } from "@crm/db"
import { requireApprovedUser, requireAdmin } from "@crm/auth/session"
import { and, asc, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function getOrCreatePerm(userId: string) {
  const rows = await db.select().from(chatPermissions).where(eq(chatPermissions.userId, userId)).limit(1)
  if (rows[0]) return rows[0]
  const [created] = await db.insert(chatPermissions).values({ userId }).returning()
  return created
}

export type ChatState = {
  messages: {
    id: number
    userId: string
    name: string
    role: string
    messageText: string
    isDeleted: boolean
    createdAt: string | Date
  }[]
  muted: boolean
  banned: boolean
  meId: string
  meRole: string
}

export async function getChatState(): Promise<ChatState> {  const me = await requireApprovedUser()
  const perm = await getOrCreatePerm(me.id)
  const rows = await db
    .select()
    .from(chatMessages)
    .orderBy(asc(chatMessages.createdAt))
    .limit(100)
  return {
    messages: rows.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      role: m.role,
      messageText: m.isDeleted ? "" : m.messageText,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt,
    })),
    muted: perm.isMuted,
    banned: perm.isBanned,
    meId: me.id,
    meRole: me.role,
  }
}

export async function sendChatMessage(text: string) {  const me = await requireApprovedUser()
  const body = text?.trim()
  if (!body) return { error: "رسالة فارغة / Empty message" }
  const perm = await getOrCreatePerm(me.id)
  if (perm.isBanned) return { error: "تم طردك / You have been banned" }
  if (perm.isMuted) return { error: "أنت مكتوم / You are muted" }
  await db.insert(chatMessages).values({
    userId: me.id,
    email: me.email,
    name: me.name,
    role: me.role,
    messageText: body,
  })
  revalidatePath("/chat")
  return { success: true }
}

export async function deleteChatMessage(id: number) {
  const me = await requireApprovedUser()
  const rows = await db
    .select({ userId: chatMessages.userId })
    .from(chatMessages)
    .where(eq(chatMessages.id, id))
    .limit(1)
  const msg = rows[0]
  if (!msg) return { error: "الرسالة غير موجودة / Message not found" }
  if (msg.userId !== me.id && me.role !== "admin") {
    return { error: "غير مصرح / Not allowed" }
  }
  await db.update(chatMessages).set({ isDeleted: true }).where(eq(chatMessages.id, id))
  revalidatePath("/chat")
  return { success: true }
}

/** Alias used by ChatView: returns the message list only. */
export async function getChatMessages() {
  const state = await getChatState()
  return state.messages
}

/** Alias used by ChatView moderation panel. */
export async function getChatRoster() {
  return getChatUsers()
}

export async function getChatUsers() {
  await requireAdmin()
  const users = await db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.status, "approved"))
    .orderBy(asc(userTable.name))
  const perms = await db.select().from(chatPermissions)
  return users.map((u) => {
    const p = perms.find((x) => x.userId === u.id)
    return { ...u, isMuted: p?.isMuted ?? false, isBanned: p?.isBanned ?? false }
  })
}

export async function setChatMute(userId: string, isMuted: boolean) {
  await requireAdmin()
  await getOrCreatePerm(userId)
  await db.update(chatPermissions).set({ isMuted }).where(eq(chatPermissions.userId, userId))
  revalidatePath("/chat")
  return { success: true }
}

export async function setChatBan(userId: string, isBanned: boolean) {
  await requireAdmin()
  await getOrCreatePerm(userId)
  await db.update(chatPermissions).set({ isBanned }).where(eq(chatPermissions.userId, userId))
  revalidatePath("/chat")
  return { success: true }
}
