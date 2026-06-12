import { getFeedback } from "@/app/actions/feedback"
import { getCurrentUser } from "@crm/auth/session"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/stat-card"
import { MessageSquare, Phone } from "lucide-react"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export default async function FeedbackPage() {
  const [items, user] = await Promise.all([getFeedback(), getCurrentUser()])
  const isAdmin = user?.role === "admin"

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">التقييمات</h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "جميع تقييمات الفريق" : "سجل تقييماتك للعملاء"} ({items.length})
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{fb.clientName ?? fb.clientId}</span>
                    <StatusBadge status={fb.clientStatus} />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(fb.createdAt)}</span>
                </div>
                {fb.notes && <p className="rounded-md bg-muted/50 p-2 text-sm text-foreground">{fb.notes}</p>}
                {isAdmin && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    بواسطة {fb.salesName}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
