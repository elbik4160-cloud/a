"use client"

import { authClient } from "@crm/auth/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function SignOutButton({
  variant = "outline",
  className,
  withLabel = true,
}: {
  variant?: "outline" | "ghost" | "default"
  className?: string
  withLabel?: boolean
}) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      await authClient.signOut()
    } catch (err) {
      console.log("[v0] signOut error:", err)
      toast.error("تعذر تسجيل الخروج / Could not sign out")
    } finally {
      // Hard navigation guarantees the cleared session cookie takes effect
      // and all client state is reset, regardless of the request outcome.
      window.location.href = "/sign-in"
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleSignOut} disabled={loading}>
      <LogOut className="h-4 w-4" />
      {withLabel && <span>تسجيل الخروج</span>}
    </Button>
  )
}
