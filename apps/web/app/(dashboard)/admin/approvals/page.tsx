import { getPendingUsers } from "@/app/actions/users"
import { ApprovalsView } from "@/components/approvals-view"

export default async function ApprovalsPage() {
  const pending = await getPendingUsers()
  return <ApprovalsView initialPending={pending} />
}
