import { getMyLeadsEnriched, getMyMission, getMyNudges } from "@/app/actions/my-leads"
import { getResaleListings } from "@/app/actions/resale"
import { getSalesMembers } from "@/app/actions/leads"
import { getCurrentUser } from "@crm/auth/session"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Merged workspace: My Leads + Resale Market + Resale Admin in one place.
export default async function WorkspacePage() {
  const me = await getCurrentUser()
  if (!me) redirect("/sign-in")
  if (me.status !== "approved") redirect("/pending")

  const isAdmin = me.role === "admin"

  const [leads, mission, nudges, listings, members] = await Promise.all([
    getMyLeadsEnriched(),
    getMyMission(),
    getMyNudges(),
    getResaleListings(),
    isAdmin ? getSalesMembers() : Promise.resolve([]),
  ])

  return (
    <WorkspaceSwitcher
      role={me.role}
      leads={leads}
      mission={mission}
      nudges={nudges}
      listings={listings}
      members={members}
    />
  )
}
