"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateUserRole, setUserStatus } from "@/app/actions/users"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@crm/shared-lib"

type ManagedUser = {
  id: string
  name: string
  email: string
  role: string
  status: string
  isSelf: boolean
  feedbackCount: number
  clientCount: number
}

const statusLabel: Record<string, string> = {
  approved: "مفعّل",
  pending: "معلّق",
  rejected: "مرفوض",
}

const statusColor: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
}

export function UsersView({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function changeRole(userId: string, role: "sales" | "admin") {
    startTransition(async () => {
      const res = await updateUserRole(userId, role)
      if (res?.error) toast.error(res.error)
      else {
        toast.success("تم تحديث الدور")
        router.refresh()
      }
    })
  }

  function changeStatus(userId: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const res = await setUserStatus(userId, status)
      if (res?.error) toast.error(res.error)
      else {
        toast.success("تم تحديث الحالة")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h2>
        <p className="text-sm text-muted-foreground">{initialUsers.length} مستخدم</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">العملاء</TableHead>
                  <TableHead className="text-right">التقييمات</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {u.name}
                          {u.isSelf && <span className="mr-1 text-xs text-muted-foreground">(أنت)</span>}
                        </span>
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {u.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColor[u.status])}>
                        {statusLabel[u.status] ?? u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{u.clientCount}</TableCell>
                    <TableCell className="text-sm">{u.feedbackCount}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => changeRole(u.id, v as "sales" | "admin")}
                        disabled={u.isSelf || pending}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">مندوب مبيعات</SelectItem>
                          <SelectItem value="admin">مدير</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {!u.isSelf &&
                        (u.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => changeStatus(u.id, "rejected")}
                            disabled={pending}
                          >
                            تعطيل
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(u.id, "approved")} disabled={pending}>
                            تفعيل
                          </Button>
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
