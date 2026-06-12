import { getResaleListings } from "@/app/actions/resale"
import { getSalesMembers } from "@/app/actions/leads"
import { ResaleAdminView } from "@/components/resale-admin-view"
import { getCurrentUser } from "@crm/auth/session"
import { redirect } from "next/navigation"

export default async function ResalePage() {
  const me = await getCurrentUser()
  if (!me) redirect("/sign-in")
  if (me.status !== "approved") redirect("/pending")
  if (me.role !== "admin") redirect("/resale-market")

  const [listings, members] = await Promise.all([getResaleListings(), getSalesMembers()])

  return (
    <div className="p-4 md:p-6">
      <ResaleAdminView initialListings={listings} members={members} />
    </div>
  )
}
