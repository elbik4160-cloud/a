"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveUser, rejectUser } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { ShieldCheck, Check, X, UserRound } from "lucide-react"

type PendingUser = {
  id: string
  name: string
  email: string
  requestedRole: string
  createdAt: Date
}

export function ApprovalsView({ initialPending }: { initialPending: PendingUser[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleApprove(userId: string, role: "sales" | "admin") {
    startTransition(async () => {
      try {
        await approveUser(userId, role)
        toast.success("تمت الموافقة على العضو")
        router.refresh()
      } catch {
        toast.error("تعذر تنفيذ الإجراء")
      }
    })
  }

  function handleReject(userId: string) {
    startTransition(async () => {
      try {
        await rejectUser(userId)
        toast.success("تم رفض الطلب")
        router.refresh()
      } catch {
        toast.error("تعذر تنفيذ الإجراء")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">طلبات الانضمام</h2>
        <p className="text-sm text-muted-foreground">راجع طلبات التسجيل الجديدة ووافق عليها</p>
      </div>

      {initialPending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة حالياً.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {initialPending.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{u.name}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {u.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      الدور المطلوب: {u.requestedRole === "admin" ? "مدير" : "مندوب مبيعات"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => handleApprove(u.id, "sales")} disabled={pending}>
                    <Check className="ml-1 h-4 w-4" />
                    قبول كمندوب
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleApprove(u.id, "admin")} disabled={pending}>
                    قبول كمدير
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(u.id)}
                    disabled={pending}
                    className="text-destructive"
                  >
                    <X className="ml-1 h-4 w-4" />
                    رفض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
