"use server"

import { db } from "@crm/db"
import { feedback, leads, leadActivities } from "@crm/db"
import { requireAdmin } from "@crm/auth/session"
import { sql } from "drizzle-orm"
import { PIPELINE_STAGES } from "@crm/shared-lib"

export type RepPerformance = {
  salesName: string
  salesEmail: string
  total: number
  won: number
  interested: number
}

export async function getReports() {
  await requireAdmin()

  const byRep = await db
    .select({
      salesName: feedback.salesName,
      salesEmail: feedback.salesEmail,
      total: sql<number>`count(*)::int`,
      won: sql<number>`count(*) filter (where ${feedback.clientStatus} = 'closed_won')::int`,
      interested: sql<number>`count(*) filter (where ${feedback.clientStatus} = 'interested')::int`,
    })
    .from(feedback)
    .groupBy(feedback.salesName, feedback.salesEmail)

  const byStatus = await db
    .select({
      status: feedback.clientStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(feedback)
    .groupBy(feedback.clientStatus)

  // Pipeline funnel: lead count per stage (ordered by stage sequence).
  const stageRows = await db
    .select({
      stage: leads.status,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .groupBy(leads.status)
  const stageMap = new Map(stageRows.map((r) => [r.stage, Number(r.count)]))
  const funnel = PIPELINE_STAGES.map((s) => ({
    stage: s.value,
    ar: s.ar,
    en: s.en,
    count: stageMap.get(s.value) ?? 0,
  }))

  // Activity KPIs per rep (calls / whatsapp / meetings logged).
  const activityRows = await db
    .select({
      userId: leadActivities.userId,
      userName: leadActivities.userName,
      calls: sql<number>`count(*) filter (where ${leadActivities.type} = 'Call')::int`,
      whatsapp: sql<number>`count(*) filter (where ${leadActivities.type} = 'WhatsApp')::int`,
      meetings: sql<number>`count(*) filter (where ${leadActivities.type} = 'Meeting')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(leadActivities)
    .groupBy(leadActivities.userId, leadActivities.userName)

  const wonLeads = await db
    .select({
      userId: leads.assignedToId,
      won: sql<number>`count(*) filter (where ${leads.status} = 'Won')::int`,
    })
    .from(leads)
    .groupBy(leads.assignedToId)
  const wonMap = new Map(wonLeads.map((r) => [r.userId, Number(r.won)]))

  const activityByRep = activityRows
    .map((r) => ({
      userId: r.userId,
      userName: r.userName,
      calls: Number(r.calls),
      whatsapp: Number(r.whatsapp),
      meetings: Number(r.meetings),
      total: Number(r.total),
      won: wonMap.get(r.userId) ?? 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    byRep: byRep
      .map((r) => ({
        salesName: r.salesName,
        salesEmail: r.salesEmail,
        total: Number(r.total),
        won: Number(r.won),
        interested: Number(r.interested),
      }))
      .sort((a, b) => b.total - a.total),
    byStatus: byStatus.map((s) => ({ status: s.status, count: Number(s.count) })),
    funnel,
    activityByRep,
  }
}
