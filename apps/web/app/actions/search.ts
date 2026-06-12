"use server"

import { db } from "@crm/db"
import { leads } from "@crm/db"
import { requireApprovedUser } from "@crm/auth/session"
import { and, eq, ilike, or, sql } from "drizzle-orm"

export type LeadSearchResult = {
  id: number
  name: string
  phone: string
  project: string | null
  status: string
  assignedToName: string | null
}

/** Global lead search for the command palette. Admins search all leads; sales only their own. */
export async function searchLeads(query: string): Promise<LeadSearchResult[]> {
  const user = await requireApprovedUser()
  const q = query.trim()
  if (q.length < 2) return []

  const text = `%${q}%`
  const matches = or(ilike(leads.name, text), ilike(leads.phone, text), ilike(leads.project, text))

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      project: leads.project,
      status: leads.status,
      assignedToName: leads.assignedToName,
    })
    .from(leads)
    .where(user.role === "admin" ? matches : and(matches, eq(leads.assignedToId, user.id)))
    .orderBy(sql`${leads.statusChangedAt} desc`)
    .limit(8)

  return rows
}
