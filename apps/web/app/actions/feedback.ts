"use server"

import { db } from "@crm/db"
import { feedback, clients } from "@crm/db"
import { releaseClient } from "@/app/actions/queue"
import { requireApprovedUser } from "@crm/auth/session"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type FeedbackWithClient = {
  id: number
  clientId: string
  clientName: string | null
  salesName: string
  salesEmail: string
  clientStatus: string
  notes: string | null
  createdAt: Date
}

/**
 * Submit feedback for a client. By default this also releases the client lock
 * (the rep is done working it). If status is follow_up, we keep it claimable later.
 */
export async function submitFeedback(input: {
  clientId: string
  clientStatus: string
  notes?: string
  releaseLock?: boolean
}) {
  const user = await requireApprovedUser()

  if (!input.clientStatus) {
    return { error: "يجب اختيار حالة العميل" }
  }

  const [client] = await db.select().from(clients).where(eq(clients.clientId, input.clientId)).limit(1)

  await db.insert(feedback).values({
    clientId: input.clientId,
    salesUserId: user.id,
    salesName: user.name,
    salesEmail: user.email,
    clientData: client ? `${client.name} - ${client.phone ?? ""}` : null,
    clientStatus: input.clientStatus,
    notes: input.notes || null,
  })

  if (input.releaseLock !== false) {
    // Block re-claim for negative/closed outcomes so it isn't immediately reopened.
    const block = ["not_interested", "closed_lost", "wrong_number"].includes(input.clientStatus)
    await releaseClient(input.clientId, block)
  }

  revalidatePath("/queue")
  revalidatePath("/feedback")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function getFeedback(): Promise<FeedbackWithClient[]> {
  const user = await requireApprovedUser()
  const isAdmin = user.role === "admin"

  const rows = await db
    .select({
      id: feedback.id,
      clientId: feedback.clientId,
      clientName: clients.name,
      salesName: feedback.salesName,
      salesEmail: feedback.salesEmail,
      clientStatus: feedback.clientStatus,
      notes: feedback.notes,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .leftJoin(clients, eq(clients.clientId, feedback.clientId))
    .where(isAdmin ? undefined : eq(feedback.salesUserId, user.id))
    .orderBy(desc(feedback.createdAt))

  return rows
}

export async function getClientFeedback(clientId: string): Promise<FeedbackWithClient[]> {
  await requireApprovedUser()
  const rows = await db
    .select({
      id: feedback.id,
      clientId: feedback.clientId,
      clientName: clients.name,
      salesName: feedback.salesName,
      salesEmail: feedback.salesEmail,
      clientStatus: feedback.clientStatus,
      notes: feedback.notes,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .leftJoin(clients, eq(clients.clientId, feedback.clientId))
    .where(eq(feedback.clientId, clientId))
    .orderBy(desc(feedback.createdAt))
  return rows
}
