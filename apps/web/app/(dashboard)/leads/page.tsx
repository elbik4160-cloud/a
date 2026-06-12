import { getAllLeads, getSalesMembers } from "@/app/actions/leads"
import { LeadsView } from "@/components/leads-view"
import { getCurrentUser } from "@crm/auth/session"
import { redirect } from "next/navigation"

export default async function LeadsPage() {
  const me = await getCurrentUser()
  if (!me) redirect("/sign-in")
  if (me.status !== "approved") redirect("/pending")
  if (me.role !== "admin") redirect("/my-leads")

  const [leads, members] = await Promise.all([getAllLeads(), getSalesMembers()])
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">العملاء المحتملون / Leads</h1>
        <p className="text-sm text-muted-foreground">
          إدارة وتوزيع العملاء المحتملين على المندوبين / Manage and distribute leads
        </p>
      </div>
      <LeadsView initialLeads={leads} members={members} />
    </div>
  )
}
