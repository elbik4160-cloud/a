"use server"

import { db } from "@crm/db"
import { clients, clientLocks, feedback, user as userTable } from "@crm/db"
import { requireApprovedUser } from "@crm/auth/session"
import { desc, eq, gt, sql } from "drizzle-orm"

const LOCK_DURATION_MIN = 30

export type DashboardStats = {
  totalClients: number
  myClients: number
  activeLocks: number
  myFeedback: number
  pendingUsers: number
  recentFeedback: {
    id: number
    clientId: string
    salesName: string
    clientStatus: string
    notes: string | null
    createdAt: Date
  }[]
  statusBreakdown: { status: string; count: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireApprovedUser()
  const isAdmin = user.role === "admin"
  const cutoff = new Date(Date.now() - LOCK_DURATION_MIN * 60_000)

  const [totalClientsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(clients)

  const [myClientsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.createdBy, user.id))

  const [activeLocksRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clientLocks)
    .where(gt(clientLocks.lockTime, cutoff))

  const [myFeedbackRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedback)
    .where(eq(feedback.salesUserId, user.id))

  const [pendingUsersRow] = isAdmin
    ? await db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(eq(userTable.status, "pending"))
    : [{ count: 0 }]

  const recentFeedback = await db
    .select({
      id: feedback.id,
      clientId: feedback.clientId,
      salesName: feedback.salesName,
      clientStatus: feedback.clientStatus,
      notes: feedback.notes,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .where(isAdmin ? undefined : eq(feedback.salesUserId, user.id))
    .orderBy(desc(feedback.createdAt))
    .limit(6)

  const statusRows = await db
    .select({
      status: feedback.clientStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(feedback)
    .where(isAdmin ? undefined : eq(feedback.salesUserId, user.id))
    .groupBy(feedback.clientStatus)

  return {
    totalClients: Number(totalClientsRow?.count ?? 0),
    myClients: Number(myClientsRow?.count ?? 0),
    activeLocks: Number(activeLocksRow?.count ?? 0),
    myFeedback: Number(myFeedbackRow?.count ?? 0),
    pendingUsers: Number(pendingUsersRow?.count ?? 0),
    recentFeedback,
    statusBreakdown: statusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
  }
}
