"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@crm/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [requestedRole, setRequestedRole] = useState("sales")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignUp) {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        // @ts-expect-error additional field configured in Better Auth
        requestedRole,
      })
      setLoading(false)
      if (error) {
        setError(translateError(error.message))
        return
      }
      toast.success("تم إرسال طلب التسجيل بنجاح، بانتظار موافقة الإدارة")
      router.push("/pending")
      router.refresh()
      return
    }

    const { error } = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (error) {
      setError(translateError(error.message))
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-gradient-to-bl from-secondary via-background to-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground text-balance">نظام إدارة المبيعات</h1>
          <p className="text-sm text-muted-foreground mt-1">منصة متكاملة لإدارة العملاء والمتابعة</p>
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold text-foreground">{isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "أدخل بياناتك لإرسال طلب الانضمام" : "أدخل بريدك وكلمة المرور للمتابعة"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="مثال: أحمد محمد"
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  dir="ltr"
                  className="text-left"
                  placeholder="********"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>

              {isSignUp && (
                <div className="flex flex-col gap-2">
                  <Label>الصلاحية المطلوبة</Label>
                  <RadioGroup
                    value={requestedRole}
                    onValueChange={setRequestedRole}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="role-sales"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent"
                    >
                      <RadioGroupItem value="sales" id="role-sales" />
                      <span className="text-sm font-medium">مندوب مبيعات</span>
                    </Label>
                    <Label
                      htmlFor="role-admin"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent"
                    >
                      <RadioGroupItem value="admin" id="role-admin" />
                      <span className="text-sm font-medium">مدير / إدارة</span>
                    </Label>
                  </RadioGroup>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "جاري المعالجة..." : isSignUp ? "إرسال طلب التسجيل" : "تسجيل الدخول"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              {isSignUp ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {isSignUp ? "تسجيل الدخول" : "إنشاء حساب"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function translateError(message?: string): string {
  if (!message) return "حدث خطأ ما، يرجى المحاولة مرة أخرى"
  const m = message.toLowerCase()
  if (m.includes("invalid") && m.includes("password")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة"
  if (m.includes("invalid email")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة"
  if (m.includes("already") || m.includes("exist")) return "البريد الإلكتروني مسجل بالفعل"
  if (m.includes("credential")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة"
  if (m.includes("password") && m.includes("short")) return "كلمة المرور قصيرة جداً (8 أحرف على الأقل)"
  return message
}
