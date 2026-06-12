"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { Trophy, Phone, MessageCircle, Users, Filter, Medal, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCsv } from "@crm/shared-lib"

type RepPerformance = {
  salesName: string
  salesEmail: string
  total: number
  won: number
  interested: number
}

type FunnelStage = { stage: string; ar: string; en: string; count: number }

type ActivityRep = {
  userId: string
  userName: string
  calls: number
  whatsapp: number
  meetings: number
  total: number
  won: number
}

const statusLabels: Record<string, string> = {
  interested: "مهتم",
  not_interested: "غير مهتم",
  follow_up: "متابعة",
  no_answer: "لم يرد",
  closed_won: "تم الإغلاق",
  closed_lost: "خسارة",
  wrong_number: "رقم خاطئ",
}

const STAGE_BAR_COLORS: Record<string, string> = {
  New: "#0ea5e9",
  Contacted: "#6366f1",
  FollowUp: "#f59e0b",
  Meeting: "#8b5cf6",
  Negotiation: "#f97316",
  Won: "#10b981",
  Lost: "#f43f5e",
}

export function ReportsView({
  byRep,
  byStatus,
  funnel,
  activityByRep,
}: {
  byRep: RepPerformance[]
  byStatus: { status: string; count: number }[]
  funnel: FunnelStage[]
  activityByRep: ActivityRep[]
}) {
  // Recharts ResponsiveContainer cannot measure during SSR; render charts after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const repChartData = byRep.map((r) => ({ name: r.salesName, total: r.total, won: r.won }))
  const statusChartData = byStatus.map((s) => ({
    name: statusLabels[s.status] ?? s.status,
    count: s.count,
  }))
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count))

  // Leaderboard scoring: weighted points across activity + wins.
  const leaderboard = [...activityByRep]
    .map((r) => ({
      ...r,
      points: r.calls * 1 + r.whatsapp * 1 + r.meetings * 3 + r.won * 10,
    }))
    .sort((a, b) => b.points - a.points)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">التقارير والأداء / Reports</h2>
          <p className="text-sm text-muted-foreground">أداء الفريق وتحليل خط الأنابيب / Team performance & pipeline analytics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              `crm-report-${new Date().toISOString().slice(0, 10)}.csv`,
              ["المندوب / Rep", "إجمالي / Total", "نجاح / Won", "مكالمات / Calls", "واتساب / WhatsApp", "اجتماعات / Meetings", "نقاط / Points"],
              leaderboard.map((r) => [r.userName, r.total, r.won, r.calls, r.whatsapp, r.meetings, r.points]),
            )
          }
        >
          <Download className="ml-2 h-4 w-4" />
          تصدير CSV
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">نظرة عامة / Overview</TabsTrigger>
          <TabsTrigger value="funnel">القمع / Funnel</TabsTrigger>
          <TabsTrigger value="activity">النشاط / Activity</TabsTrigger>
          <TabsTrigger value="leaderboard">المتصدرون / Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">عدد التقييمات لكل مندوب / Reviews per rep</CardTitle>
            </CardHeader>
            <CardContent>
              {repChartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">لا توجد بيانات بعد</p>
              ) : !mounted ? (
                <div className="h-[280px] w-full animate-pulse rounded-lg bg-muted/30" />
              ) : (
                <ChartContainer
                  config={{
                    total: { label: "الإجمالي", color: "hsl(var(--primary))" },
                    won: { label: "نجاح", color: "hsl(var(--success))" },
                  }}
                  className="h-[280px] w-full"
                >
                  <BarChart data={repChartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    <Bar dataKey="won" fill="var(--color-won)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">توزيع حالات العملاء / Status distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">لا توجد بيانات بعد</p>
              ) : !mounted ? (
                <div className="h-[280px] w-full animate-pulse rounded-lg bg-muted/30" />
              ) : (
                <ChartContainer
                  config={{ count: { label: "العدد", color: "hsl(var(--primary))" } }}
                  className="h-[280px] w-full"
                >
                  <BarChart data={statusChartData} layout="vertical">
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                      {statusChartData.map((_, i) => (
                        <Cell key={i} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel */}
        <TabsContent value="funnel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-primary" />
                قمع المبيعات / Sales funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {funnel.every((f) => f.count === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عملاء بعد</p>
              ) : (
                funnel.map((f) => (
                  <div key={f.stage} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {f.ar} / {f.en}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{f.count}</span>
                    </div>
                    <div className="h-7 w-full overflow-hidden rounded-md bg-muted">
                      <div
                        className="flex h-full items-center rounded-md transition-all"
                        style={{
                          width: `${Math.max(4, (f.count / maxFunnel) * 100)}%`,
                          backgroundColor: STAGE_BAR_COLORS[f.stage] ?? "hsl(var(--primary))",
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">نشاط الفريق / Team activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activityByRep.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد أنشطة مسجلة بعد</p>
              ) : (
                activityByRep.map((r) => (
                  <div key={r.userId} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <span className="text-sm font-medium text-foreground">{r.userName}</span>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-sky-500" /> {r.calls} مكالمة
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> {r.whatsapp} واتساب
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-violet-500" /> {r.meetings} اجتماع
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" /> {r.won} صفقة
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Medal className="h-4 w-4 text-amber-500" />
                لوحة المتصدرين / Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {leaderboard.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
              ) : (
                leaderboard.map((r, i) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    style={
                      i === 0
                        ? { borderColor: "rgba(245,158,11,0.5)", background: "rgba(245,158,11,0.06)" }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          background:
                            i === 0
                              ? "#f59e0b"
                              : i === 1
                                ? "#94a3b8"
                                : i === 2
                                  ? "#b45309"
                                  : "hsl(var(--muted))",
                          color: i <= 2 ? "#fff" : "hsl(var(--foreground))",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{r.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.won} صفقة · {r.total} نشاط
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">{r.points} نقطة</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
