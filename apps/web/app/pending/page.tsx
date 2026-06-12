import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { SignOutButton } from "@/components/sign-out-button"

export default async function PendingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.status === "approved") redirect("/")

  const rejected = user.status === "rejected"

  return (
    <main className="min-h-svh bg-gradient-to-bl from-secondary via-background to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="flex flex-col items-center text-center gap-4 py-10">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              rejected ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
            }`}
          >
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {rejected ? "تم رفض طلب الانضمام" : "حسابك قيد المراجعة"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-pretty">
              {rejected
                ? "للأسف لم تتم الموافقة على طلب انضمامك. يرجى التواصل مع الإدارة لمزيد من التفاصيل."
                : "تم استلام طلب تسجيلك بنجاح. سيتمكن من الوصول للنظام بمجرد موافقة الإدارة على حسابك."}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3 text-sm w-full">
            <p className="text-muted-foreground">
              مرحباً <span className="font-semibold text-foreground">{user.name}</span>
            </p>
            <p className="text-muted-foreground mt-1" dir="ltr">
              {user.email}
            </p>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  )
}
