import type React from "react"
// dashboard shell — dark immersive theme + per-route transitions
import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickActionFab } from "@/components/quick-action-fab"
import { PageTransition } from "@/components/page-transition"
import { CommandPalette } from "@/components/command-palette"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect("/sign-in")
  if (user.status !== "approved") redirect("/pending")

  return (
    <div className="app-ambient flex min-h-screen bg-background">
      <DashboardSidebar role={user.role} />
      <div className="relative z-10 flex flex-1 flex-col">
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <QuickActionFab role={user.role} />
      <CommandPalette role={user.role} />
    </div>
  )
}
