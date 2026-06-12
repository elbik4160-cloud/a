"use server"

import { db } from "@crm/db"
import { user, session, leads, leadActivities } from "@crm/db"
import { requireAdmin } from "@crm/auth/session"
import { and, desc, eq, gt, sql } from "drizzle-orm"

export type RepStatus = {
  userId: string
  name: string
  email: string
  online: boolean
  lastActivityAt: Date | null
  activitiesToday: number
  assignedLeads: number
  overdueLeads: number
  state: "active" | "idle" | "offline"
}

export type WatchdogActivity = {
  id: number
  userName: string
  type: string
  leadId: number
  outcome: string | null
  createdAt: Date
}

export type WatchdogAlert = {
  id: string
  severity: "high" | "medium" | "low"
  ar: string
  en: string
}

export type WatchdogData = {
  reps: RepStatus[]
  feed: WatchdogActivity[]
  alerts: WatchdogAlert[]
  daily: { date: string; label: string; count: number }[]
  summary: { onlineReps: number; totalActivitiesToday: number; overdueTotal: number; idleReps: number }
}

const IDLE_MIN = 90 // minutes without activity while session active => idle

export async function getWatchdogData(): Promise<WatchdogData> {
  await requireAdmin()
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Sales reps
  const reps = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(and(eq(user.role, "sales"), eq(user.status, "approved")))

  // Active (non-expired) sessions => "online"
  const activeSessions = await db
    .select({ userId: session.userId })
    .from(session)
    .where(gt(session.expiresAt, new Date()))
  const onlineSet = new Set(activeSessions.map((s) => s.userId))

  // Last activity + today count per user
  const lastActivityRows = await db
    .select({
      userId: leadActivities.userId,
      last: sql<Date>`max(${leadActivities.createdAt})`,
      today: sql<number>`count(*) filter (where ${leadActivities.createdAt} >= ${startOfToday})::int`,
    })
    .from(leadActivities)
    .groupBy(leadActivities.userId)
  const actMap = new Map(lastActivityRows.map((r) => [r.userId, r]))

  // Assigned + overdue leads per user (overdue = status not Won/Lost and not touched in 3+ days)
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)
  const leadRows = await db
    .select({
      userId: leads.assignedToId,
      assigned: sql<number>`count(*)::int`,
      overdue: sql<number>`count(*) filter (where ${leads.status} not in ('Won','Lost') and ${leads.statusChangedAt} < ${threeDaysAgo})::int`,
    })
    .from(leads)
    .groupBy(leads.assignedToId)
  const leadMap = new Map(leadRows.map((r) => [r.userId, r]))

  const repStatuses: RepStatus[] = reps.map((r) => {
    const act = actMap.get(r.id)
    const ld = leadMap.get(r.id)
    const online = onlineSet.has(r.id)
    const lastAt = act?.last ? new Date(act.last) : null
    const minsSince = lastAt ? (now - lastAt.getTime()) / 60000 : Infinity
    let state: RepStatus["state"] = "offline"
    if (online) state = minsSince > IDLE_MIN ? "idle" : "active"
    return {
      userId: r.id,
      name: r.name,
      email: r.email,
      online,
      lastActivityAt: lastAt,
      activitiesToday: Number(act?.today ?? 0),
      assignedLeads: Number(ld?.assigned ?? 0),
      overdueLeads: Number(ld?.overdue ?? 0),
      state,
    }
  })

  // Recent activity feed
  const feedRows = await db
    .select({
      id: leadActivities.id,
      userName: leadActivities.userName,
      type: leadActivities.type,
      leadId: leadActivities.leadId,
      outcome: leadActivities.outcome,
      createdAt: leadActivities.createdAt,
    })
    .from(leadActivities)
    .orderBy(desc(leadActivities.createdAt))
    .limit(15)

  // Daily activity comparison (last 7 days)
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const dailyRows = await db
    .select({
      day: sql<string>`to_char(${leadActivities.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(leadActivities)
    .where(gt(leadActivities.createdAt, sevenDaysAgo))
    .groupBy(sql`to_char(${leadActivities.createdAt}, 'YYYY-MM-DD')`)
  const dailyMap = new Map(dailyRows.map((r) => [r.day, Number(r.count)]))
  const dayLabels = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  const daily: WatchdogData["daily"] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    daily.push({ date: key, label: dayLabels[d.getDay()], count: dailyMap.get(key) ?? 0 })
  }

  // Alerts
  const alerts: WatchdogAlert[] = []
  for (const r of repStatuses) {
    if (r.overdueLeads >= 5) {
      alerts.push({
        id: `overdue-${r.userId}`,
        severity: "high",
        ar: `${r.name} لديه ${r.overdueLeads} عميل متأخر بدون متابعة`,
        en: `${r.name} has ${r.overdueLeads} stale leads with no follow-up`,
      })
    }
    if (r.state === "idle") {
      alerts.push({
        id: `idle-${r.userId}`,
        severity: "medium",
        ar: `${r.name} متصل لكن خامل (لا نشاط منذ فترة)`,
        en: `${r.name} is online but idle (no recent activity)`,
      })
    }
    if (r.online && r.activitiesToday === 0) {
      alerts.push({
        id: `noactivity-${r.userId}`,
        severity: "low",
        ar: `${r.name} لم يسجل أي نشاط اليوم`,
        en: `${r.name} has logged no activity today`,
      })
    }
  }

  const summary = {
    onlineReps: repStatuses.filter((r) => r.online).length,
    totalActivitiesToday: repStatuses.reduce((s, r) => s + r.activitiesToday, 0),
    overdueTotal: repStatuses.reduce((s, r) => s + r.overdueLeads, 0),
    idleReps: repStatuses.filter((r) => r.state === "idle").length,
  }

  return { reps: repStatuses, feed: feedRows, alerts, daily, summary }
}
