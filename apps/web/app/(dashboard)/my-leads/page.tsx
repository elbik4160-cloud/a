import { CommandCards } from "@/components/my-leads/command-cards"
import { getMyLeadsEnriched, getMyMission, getMyNudges } from "@/app/actions/my-leads"
import { getCurrentUser } from "@crm/auth/session"

export const dynamic = "force-dynamic"

// عملائي — Command Cards workspace (deck / grid / feed / board views)
export default async function MyLeadsPage() {
  const [leads, mission, nudges, user] = await Promise.all([
    getMyLeadsEnriched(),
    getMyMission(),
    getMyNudges(),
    getCurrentUser(),
  ])

  return (
    <CommandCards
      initialLeads={leads}
      initialMission={mission}
      initialNudges={nudges}
      role={user?.role ?? "sales"}
    />
  )
}
