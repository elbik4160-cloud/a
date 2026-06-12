"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { SessionUser } from "@crm/auth/session"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/notification-bell"
import { HeaderControls } from "@/components/header-controls"
import { authClient } from "@crm/auth/client"
import { useRouter } from "next/navigation"
import {
  Menu,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  UserCog,
  UserPlus,
  ScrollText,
  KeyRound,
  Layers,
  Radio,
} from "lucide-react"
import { cn } from "@crm/shared-lib"

const navItems = [
  { href: "/dashboard", label: "الرئيسية / Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "مساحة العمل / Workspace", icon: Layers },
  { href: "/chat", label: "المجموعة / Group Chat", icon: MessageSquare },
  { href: "/feedback", label: "التقييمات / Feedback", icon: MessageSquare },
  { href: "/leads", label: "العملاء المحتملون / Leads", icon: UserPlus, adminOnly: true },
  { href: "/reports", label: "التقارير / Reports", icon: BarChart3, adminOnly: true },
  { href: "/admin/watchdog", label: "المراقبة / Watchdog", icon: Radio, adminOnly: true },
  { href: "/admin/permissions", label: "الصلاحيات / Permissions", icon: KeyRound, adminOnly: true },
  { href: "/admin/approvals", label: "طلبات الانضمام / Approvals", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/users", label: "إدارة المستخدمين / Users", icon: UserCog, adminOnly: true },
  { href: "/admin/audit", label: "سجل الأحداث / Audit Log", icon: ScrollText, adminOnly: true },
]

export function DashboardHeader({ user }: { user: SessionUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")

  async function handleSignOut() {
    setLoading(true)
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
            <nav className="flex flex-col gap-1 p-3 pt-12">
              {navItems
                .filter((item) => !item.adminOnly || user.role === "admin")
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-base font-semibold text-foreground md:text-lg">لوحة تحكم المبيعات</h1>
      </div>

      <div className="flex items-center gap-1">
        <HeaderControls />
        <NotificationBell />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </span>
            <div className="hidden flex-col items-start text-right sm:flex">
              <span className="text-sm font-medium leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role === "admin" ? "مدير" : "مندوب مبيعات"}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive">
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  )
}
