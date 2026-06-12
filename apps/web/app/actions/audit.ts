"use server"

import { db } from "@crm/db"
import { auditLogs } from "@crm/db"
import { requireAdmin } from "@crm/auth/session"
import { and, desc, eq, gte, lte } from "drizzle-orm"

export async function getAuditLogs(filters?: {
  action?: string
  userId?: string
  page?: number
  limit?: number
}) {
  await requireAdmin()
  const limit = filters?.limit ?? 50
  const page = filters?.page ?? 1
  const conditions = []
  if (filters?.action) conditions.push(eq(auditLogs.action, filters.action))
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId))

  const where = conditions.length ? and(...conditions) : undefined
  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
  return rows
}
