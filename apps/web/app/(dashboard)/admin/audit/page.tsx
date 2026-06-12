import { getAuditLogs } from "@/app/actions/audit"
import { AuditView } from "@/components/audit-view"

export default async function AuditPage() {
  const logs = await getAuditLogs({ limit: 100 })
  return (
    <div className="p-4 md:p-6">
      <AuditView logs={logs} />
    </div>
  )
}
