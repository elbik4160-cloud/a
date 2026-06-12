import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.status !== "approved") redirect("/pending")
  if (user.role !== "admin") redirect("/dashboard")
  return <>{children}</>
}
