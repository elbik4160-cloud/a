import { redirect } from "next/navigation"
import { getCurrentUser } from "@crm/auth/session"
import { getWatchdogData } from "@/app/actions/watchdog"
import { WatchdogView } from "@/components/watchdog-view"

export default async function WatchdogPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")
  const data = await getWatchdogData()
  return <WatchdogView initial={data} />
}
