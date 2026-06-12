import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"

export default async function RootPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.status !== "approved") redirect("/pending")
  redirect("/dashboard")
}
