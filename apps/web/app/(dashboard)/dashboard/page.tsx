import { getDashboardStats } from "@/app/actions/stats"
import { getCurrentUser } from "@crm/auth/session"
import { StatCard, StatusBadge } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, UserCheck, Lock, MessageSquare, ShieldAlert, Plus, ArrowLeft } from "lucide-react"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export default async function DashboardPage() {
  const [stats, user] = await Promise.all([getDashboardStats(), getCurrentUser()])
  const isAdmin = user?.role === "admin"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-rise">
        <div>
          <h2 className="text-2xl font-bold text-foreground">مرحباً، {user?.name}</h2>
          <p className="text-sm text-muted-foreground">نظرة عامة على نشاط المبيعات</p>
        </div>
        <Button asChild>
          <Link href={isAdmin ? "/leads" : "/my-leads"}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة عميل
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-rise stagger-1">
          <StatCard title={isAdmin ? "إجمالي العملاء" : "عملائي"} value={isAdmin ? stats.totalClients : stats.myClients} icon={Users} accent="primary" />
        </div>
        <div className="animate-fade-rise stagger-2">
          <StatCard title="قيد العمل الآن" value={stats.activeLocks} icon={Lock} accent="warning" />
        </div>
        <div className="animate-fade-rise stagger-3">
          <StatCard title="تقييماتي" value={stats.myFeedback} icon={MessageSquare} accent="success" />
        </div>
        <div className="animate-fade-rise stagger-4">
          {isAdmin ? (
            <StatCard title="طلبات معلقة" value={stats.pendingUsers} icon={ShieldAlert} accent="destructive" />
          ) : (
            <StatCard title="عملاء أضفتهم" value={stats.myClients} icon={UserCheck} accent="primary" />
          )}
        </div>
      </div>

      {isAdmin && stats.pendingUsers > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium text-foreground">
                لديك {stats.pendingUsers} طلب انضمام بانتظار المراجعة
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/approvals">مراجعة الطلبات</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">أحدث التقييمات</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feedback">
                عرض الكل
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.recentFeedback.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد تقييمات بعد</p>
            ) : (
              stats.recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">{fb.salesName}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{fb.notes || "بدون ملاحظات"}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={fb.clientStatus} />
                    <span className="text-xs text-muted-foreground">{formatDate(fb.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع الحالات</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.statusBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
            ) : (
              stats.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <StatusBadge status={s.status} />
                  <span className="text-sm font-semibold text-foreground">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
