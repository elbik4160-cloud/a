"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@crm/shared-lib"
import {
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  UserCog,
  UserPlus,
  KeyRound,
  ScrollText,
  Layers,
  Radio,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
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

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">نظام المبيعات</span>
          <span className="text-xs text-muted-foreground">إدارة العملاء</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
      </nav>
      {role === "admin" && (
        <div className="border-t border-sidebar-border p-3">
          <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">صلاحية مدير</span>
        </div>
      )}
    </aside>
  )
}
