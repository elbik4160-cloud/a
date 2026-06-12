"use client"

import { useMemo, useState } from "react"
import type { AuditLog } from "@crm/db"
import { AUDIT_ACTION_LABELS } from "@crm/shared-lib"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function actionLabel(action: string) {
  const l = AUDIT_ACTION_LABELS[action]
  return l ? `${l.ar} / ${l.en}` : action
}

export function AuditView({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("")
  const [action, setAction] = useState("all")

  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs])

  const filtered = logs.filter((l) => {
    if (action !== "all" && l.action !== action) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${l.userName ?? ""} ${l.details ?? ""} ${l.entity ?? ""}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">سجل الأحداث / Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          كل الإجراءات الحساسة في النظام / Every sensitive action in the system
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="ابحث / Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الإجراءات / All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {actionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-right">
              <th className="p-3 font-medium text-muted-foreground">الوقت / Time</th>
              <th className="p-3 font-medium text-muted-foreground">المستخدم / User</th>
              <th className="p-3 font-medium text-muted-foreground">الإجراء / Action</th>
              <th className="p-3 font-medium text-muted-foreground">الكيان / Entity</th>
              <th className="p-3 font-medium text-muted-foreground">التفاصيل / Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleString("ar-EG")}
                </td>
                <td className="p-3 text-foreground">{l.userName ?? "—"}</td>
                <td className="p-3">
                  <Badge variant="secondary">{actionLabel(l.action)}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {l.entity ?? "—"}
                  {l.entityId ? ` #${l.entityId}` : ""}
                </td>
                <td className="p-3 text-muted-foreground">{l.details ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  لا توجد سجلات / No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
