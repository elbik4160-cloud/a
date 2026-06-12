"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ClientWithMeta } from "@/app/actions/clients"
import { createClient, updateClient, deleteClient } from "@/app/actions/clients"
import { claimClient } from "@/app/actions/queue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/stat-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Search, Phone, Pencil, Trash2, PlayCircle, UserPlus } from "lucide-react"

type Props = {
  initialClients: ClientWithMeta[]
  isAdmin: boolean
  search: string
}

const emptyForm = {
  name: "",
  countryCode: "",
  phone: "",
  countryCode2: "",
  phone2: "",
  request: "",
  notes: "",
  chooseSales: "",
}

export function ClientsView({ initialClients, isAdmin, search }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientWithMeta | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<ClientWithMeta | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    router.push(`/clients?${params.toString()}`)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(client: ClientWithMeta) {
    setEditing(client)
    setForm({
      name: client.name,
      countryCode: client.countryCode ?? "",
      phone: client.phone ?? "",
      countryCode2: client.countryCode2 ?? "",
      phone2: client.phone2 ?? "",
      request: client.request ?? "",
      notes: client.notes ?? "",
      chooseSales: client.chooseSales ?? "",
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = editing ? await updateClient(editing.clientId, form) : await createClient(form)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(editing ? "تم تحديث العميل" : "تمت إضافة العميل")
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteClient(deleteTarget.clientId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("تم حذف العميل")
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  function handleClaim(client: ClientWithMeta) {
    startTransition(async () => {
      const res = await claimClient(client.clientId)
      if (!res.ok) {
        toast.error(res.error ?? "تعذر بدء العمل")
      } else {
        toast.success("تم بدء العمل على العميل", { description: "تمت إضافته إلى قائمة عملك" })
        router.push("/queue")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">العملاء</h2>
          <p className="text-sm text-muted-foreground">{initialClients.length} عميل</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو الطلب..."
            className="pr-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          بحث
        </Button>
      </form>

      {initialClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لا يوجد عملاء بعد. ابدأ بإضافة عميل جديد.</p>
            <Button onClick={openCreate} variant="outline">
              <Plus className="ml-2 h-4 w-4" />
              إضافة عميل
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {initialClients.map((client) => (
            <Card key={client.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{client.name}</span>
                    <span className="text-xs text-muted-foreground">{client.clientId}</span>
                  </div>
                  {client.lastStatus && <StatusBadge status={client.lastStatus} />}
                </div>

                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">
                      {client.countryCode ? `${client.countryCode} ` : ""}
                      {client.phone}
                    </span>
                  </div>
                )}

                {client.request && (
                  <p className="line-clamp-2 rounded-md bg-muted/50 p-2 text-sm text-foreground">{client.request}</p>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{client.feedbackCount} تقييم</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(client)} disabled={pending}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(client)} disabled={pending} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleClaim(client)} disabled={pending}>
                      <PlayCircle className="ml-1 h-4 w-4" />
                      ابدأ العمل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle>
            <DialogDescription>أدخل بيانات العميل بالكامل</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">اسم العميل *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="countryCode">كود الدولة</Label>
                <Input id="countryCode" dir="ltr" placeholder="+20" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="countryCode2">كود 2</Label>
                <Input id="countryCode2" dir="ltr" value={form.countryCode2} onChange={(e) => setForm({ ...form, countryCode2: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="phone2">رقم بديل</Label>
                <Input id="phone2" dir="ltr" value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="request">الطلب</Label>
              <Textarea id="request" value={form.request} onChange={(e) => setForm({ ...form, request: e.target.value })} rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            {isAdmin && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="chooseSales">تخصيص لمندوبين (بريد إلكتروني مفصول بفاصلة)</Label>
                <Input id="chooseSales" dir="ltr" placeholder="rep@mail.com, rep2@mail.com" value={form.chooseSales} onChange={(e) => setForm({ ...form, chooseSales: e.target.value })} />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "جاري الحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العميل</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العميل "{deleteTarget?.name}" وكل بياناته المرتبطة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
