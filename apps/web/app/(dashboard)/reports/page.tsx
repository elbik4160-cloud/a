import { redirect } from "next/navigation"
import { getReports } from "@/app/actions/reports"
import { getCurrentUser } from "@crm/auth/session"
import { ReportsView } from "@/components/reports-view"

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")
  const data = await getReports()
  return (
    <ReportsView
      byRep={data.byRep}
      byStatus={data.byStatus}
      funnel={data.funnel}
      activityByRep={data.activityByRep}
    />
  )
}
