"use client"

import { useState, useTransition } from "react"
import type { PermMatrixRow } from "@/app/actions/permissions"
import { setPermission } from "@/app/actions/permissions"
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from "@crm/shared-lib"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function PermissionsView({ matrix }: { matrix: PermMatrixRow[] }) {
  const [rows, setRows] = useState(matrix)
  const [, startTransition] = useTransition()

  function toggle(userId: string, key: PermissionKey, granted: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, permissions: { ...r.permissions, [key]: granted } } : r)),
    )
    startTransition(async () => {
      const res = await setPermission({ userId, permissionKey: key, granted })
      if (res?.ok) toast.success("تم الحفظ / Saved")
      else {
        toast.error("فشل الحفظ / Save failed")
        setRows((prev) =>
          prev.map((r) =>
            r.userId === userId ? { ...r, permissions: { ...r.permissions, [key]: !granted } } : r,
          ),
        )
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الصلاحيات / Permissions</h1>
        <p className="text-sm text-muted-foreground">
          تحكّم في وصول كل مستخدم للبيانات الحساسة / Control each user&apos;s access to sensitive data
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky right-0 z-10 bg-muted/40 p-3 text-right font-medium text-foreground">
                المستخدم / User
              </th>
              {PERMISSION_KEYS.map((k) => (
                <th key={k} className="whitespace-nowrap p-3 text-center font-medium text-muted-foreground">
                  <span className="block">{PERMISSION_LABELS[k].ar}</span>
                  <span className="block text-[11px] font-normal">{PERMISSION_LABELS[k].en}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b last:border-0">
                <td className="sticky right-0 z-10 bg-card p-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                    {r.role === "admin" && (
                      <Badge variant="secondary" className="text-[10px]">
                        مدير / Admin
                      </Badge>
                    )}
                  </div>
                </td>
                {PERMISSION_KEYS.map((k) => (
                  <td key={k} className="p-3 text-center">
                    <Switch
                      checked={r.permissions[k]}
                      disabled={r.role === "admin"}
                      onCheckedChange={(v) => toggle(r.userId, k, v)}
                      aria-label={`${PERMISSION_LABELS[k].en} for ${r.name}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={PERMISSION_KEYS.length + 1} className="p-10 text-center text-muted-foreground">
                  لا يوجد مستخدمون / No users
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
