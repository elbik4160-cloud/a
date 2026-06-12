"use server"

import { db } from "@crm/db"
import { comments, leads } from "@crm/db"
import { requireApprovedUser, requireAdmin } from "@crm/auth/session"
import { logAudit } from "@crm/shared-lib/server"
import { createNotification } from "@/app/actions/notifications"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/** Admin posts a comment/instruction to a sales rep, optionally about a lead. */
export async function addComment(input: { toUserId: string; leadId?: number; text: string }) {
  const me = await requireAdmin()
  const text = input.text?.trim()
  if (!text) return { error: "النص مطلوب / Text is required" }

  let leadName = ""
  if (input.leadId) {
    const rows = await db.select({ name: leads.name }).from(leads).where(eq(leads.id, input.leadId)).limit(1)
    leadName = rows[0]?.name ?? ""
  }

  await db.insert(comments).values({
    leadId: input.leadId ?? null,
    fromUserId: me.id,
    fromUserName: me.name,
    toUserId: input.toUserId,
    text,
  })
  await createNotification({
    userId: input.toUserId,
    title: "Admin comment",
    titleAr: "تعليق من الإدارة",
    body: leadName ? `Comment on: ${leadName}` : "New comment from admin",
    bodyAr: leadName ? `تعليق على: ${leadName}` : "تعليق جديد من الإدارة",
    type: "comment",
    refId: input.leadId ? String(input.leadId) : undefined,
  })
  await logAudit({ userId: me.id, userName: me.name, action: "ADD_COMMENT", entity: "Comment", entityId: input.toUserId })
  revalidatePath("/", "layout")
  return { success: true }
}

/** Sales: comments addressed to me (unread first). */
export async function getMyComments() {
  const me = await requireApprovedUser()
  return db
    .select()
    .from(comments)
    .where(eq(comments.toUserId, me.id))
    .orderBy(desc(comments.isRead), desc(comments.createdAt))
    .limit(50)
}

/** Comments for a specific lead, visible to admin or the assigned rep. */
export async function getLeadComments(leadId: number) {
  await requireApprovedUser()
  return db.select().from(comments).where(eq(comments.leadId, leadId)).orderBy(desc(comments.createdAt))
}

export async function markCommentRead(id: number) {
  const me = await requireApprovedUser()
  await db
    .update(comments)
    .set({ isRead: true })
    .where(and(eq(comments.id, id), eq(comments.toUserId, me.id)))
  revalidatePath("/", "layout")
  return { success: true }
}
