"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { getWatchdogData, type WatchdogData } from "@/app/actions/watchdog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Activity,
  AlertTriangle,
  Users,
  Clock,
  Phone,
  MessageCircle,
  CalendarCheck,
  Mail,
  StickyNote,
  Radio,
} from "lucide-react"
import { cn } from "@crm/shared-lib"

const ACT_ICONS: Record<string, typeof Phone> = {
  Call: Phone,
  WhatsApp: MessageCircle,
  Meeting: CalendarCheck,
  Email: Mail,
  Note: StickyNote,
}

const STATE_STYLE: Record<string, { dot: string; label: string }> = {
  active: { dot: "bg-emerald-500", label: "نشط / Active" },
  idle: { dot: "bg-amber-500", label: "خامل / Idle" },
  offline: { dot: "bg-muted-foreground/40", label: "غير متصل / Offline" },
}

function relTime(d: Date | string | null) {
  if (!d) return "—"
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "الآن / now"
  if (mins < 60) return `${mins}د`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}س`
  return `${Math.floor(hrs / 24)}ي`
}

export function WatchdogView({ initial }: { initial: WatchdogData }) {
  const { data } = useSWR<WatchdogData>("watchdog", () => getWatchdogData(), {
    refreshInterval: 15000,
    fallbackData: initial,
  })
  const wd = data ?? initial
  // Recharts ResponsiveContainer cannot measure during SSR; render chart after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const summaryCards = [
    { label: "متصل الآن / Online", value: wd.summary.onlineReps, icon: Users, color: "text-emerald-500" },
    { label: "أنشطة اليوم / Today", value: wd.summary.totalActivitiesToday, icon: Activity, color: "text-sky-500" },
    { label: "متأخرة / Overdue", value: wd.summary.overdueTotal, icon: Clock, color: "text-orange-500" },
    { label: "خامل / Idle", value: wd.summary.idleReps, icon: AlertTriangle, color: "text-amber-500" },
  ]

  const sevColor: Record<string, string> = {
    high: "border-rose-500/40 bg-rose-500/5",
    medium: "border-amber-500/40 bg-amber-500/5",
    low: "border-border bg-muted/30",
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Radio className="h-5 w-5 text-emerald-500" />
            المراقبة المباشرة / Watchdog
          </h2>
          <p className="text-sm text-muted-foreground">حالة الفريق والنشاط لحظياً / Live team status & activity</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          مباشر / Live
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className={cn("h-7 w-7", c.color)} />
              <div className="flex flex-col">
                <span className="text-2xl font-bold tabular-nums text-foreground">{c.value}</span>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rep status grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">حالة المندوبين / Rep status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {wd.reps.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">لا يوجد مندوبون</p>
            ) : (
              wd.reps.map((r) => {
                const st = STATE_STYLE[r.state]
                return (
                  <div key={r.userId} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className={cn("h-2.5 w-2.5 rounded-full", st.dot)} />
                        {r.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{st.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>آخر نشاط: {relTime(r.lastActivityAt)}</span>
                      <span>اليوم: {r.activitiesToday}</span>
                      <span>عملاء: {r.assignedLeads}</span>
                      {r.overdueLeads > 0 && (
                        <span className="font-medium text-orange-500">متأخر: {r.overdueLeads}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              التنبيهات / Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
            {wd.alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">كل شيء على ما يرام / All clear</p>
            ) : (
              wd.alerts.map((a) => (
                <div key={a.id} className={cn("rounded-lg border p-3 text-xs", sevColor[a.severity])}>
                  <p className="font-medium text-foreground">{a.ar}</p>
                  <p className="text-muted-foreground">{a.en}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نشاط آخر 7 أيام / Last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <ChartContainer
                config={{ count: { label: "أنشطة", color: "hsl(var(--primary))" } }}
                className="h-[240px] w-full"
              >
                <BarChart data={wd.daily}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[240px] w-full animate-pulse rounded-lg bg-muted/30" />
            )}
          </CardContent>
        </Card>

        {/* Live feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل النشاط المباشر / Live feed</CardTitle>
          </CardHeader>
          <CardContent className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
            {wd.feed.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد نشاط بعد</p>
            ) : (
              wd.feed.map((f) => {
                const Icon = ACT_ICONS[f.type] ?? Activity
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 flex-col">
                      <span className="text-foreground">
                        <span className="font-medium">{f.userName}</span> · {f.type}
                        {f.outcome ? ` · ${f.outcome}` : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">عميل #{f.leadId}</span>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relTime(f.createdAt)}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
