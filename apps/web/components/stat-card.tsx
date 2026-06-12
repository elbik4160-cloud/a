import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@crm/shared-lib"

const statusLabels: Record<string, string> = {
  interested: "مهتم",
  not_interested: "غير مهتم",
  follow_up: "متابعة",
  no_answer: "لم يرد",
  closed_won: "تم الإغلاق",
  closed_lost: "خسارة",
  wrong_number: "رقم خاطئ",
}

const statusColors: Record<string, string> = {
  interested: "bg-success/10 text-success",
  closed_won: "bg-success/10 text-success",
  not_interested: "bg-destructive/10 text-destructive",
  closed_lost: "bg-destructive/10 text-destructive",
  follow_up: "bg-warning/10 text-warning",
  no_answer: "bg-muted text-muted-foreground",
  wrong_number: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  accent?: "primary" | "success" | "warning" | "destructive"
}) {
  const accentClass =
    accent === "success"
      ? "bg-success/10 text-success"
      : accent === "warning"
        ? "bg-warning/10 text-warning"
        : accent === "destructive"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accentClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

export { statusLabels }
