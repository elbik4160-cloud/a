import { getResaleListings } from "@/app/actions/resale"
import { ResaleBrowseView } from "@/components/resale-browse-view"
import { getCurrentUser } from "@crm/auth/session"
import { redirect } from "next/navigation"

export default async function ResaleMarketPage() {
  const me = await getCurrentUser()
  if (!me) redirect("/sign-in")
  if (me.status !== "approved") redirect("/pending")

  const listings = await getResaleListings()

  return (
    <div className="p-4 md:p-6">
      <ResaleBrowseView listings={listings} />
    </div>
  )
}
