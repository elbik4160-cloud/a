import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"
import { AuthForm } from "@/components/auth-form"

export default async function SignUpPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")
  return <AuthForm mode="sign-up" />
}
