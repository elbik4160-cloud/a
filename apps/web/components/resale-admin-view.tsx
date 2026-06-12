"use client"

import { useState, useTransition } from "react"
import type { ResaleView } from "@/app/actions/resale"
import { addResaleListing, assignResale, setResaleStatus, deleteResale } from "@/app/actions/resale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  RESALE_UNIT_TYPES,
  RESALE_FINISHING,
  RESALE_STATUSES,
  RESALE_STATUS_STYLES,
  bilingualLabel,
  findBilingual,
} from "@crm/shared-lib"
import { cn } from "@crm/shared-lib"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Trash2, Building2, User, Phone, IdCard, ImagePlus, X } from "lucide-react"
import { fileToDownscaledDataUrl } from "@crm/shared-lib"

type Member = { id: string; name: string; email: string; role: string }

export function ResaleAdminView({
  initialListings,
  members,
}: {
  initialListings: ResaleView[]
  members: Member[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  const pendingListings = initialListings.filter((l) => l.status === "Pending")

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setPhotoLoading(true)
    try {
      const url = await fileToDownscaledDataUrl(file)
      setPhoto(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحميل الصورة / Could not load image")
    } finally {
      setPhotoLoading(false)
    }
  }

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const res = await addResaleListing({
        projectName: String(formData.get("projectName") || ""),
        unitType: String(formData.get("unitType") || ""),
        floor: String(formData.get("floor") || ""),
        area: String(formData.get("area") || ""),
        price: String(formData.get("price") || ""),
        finishing: String(formData.get("finishing") || ""),
        description: String(formData.get("description") || ""),
        image: photo || "",
        ownerName: String(formData.get("ownerName") || ""),
        ownerPhone: String(formData.get("ownerPhone") || ""),
        ownerNationalId: String(formData.get("ownerNationalId") || ""),
      })
      if (res?.ok) {
        toast.success("تمت إضافة الوحدة / Listing added")
        setAddOpen(false)
        setPhoto(null)
        router.refresh()
      } else {
        toast.error(res?.error || "حدث خطأ / Something went wrong")
      }
    })
  }

  function handleAssign(resaleId: number, assignedToId: string) {
    startTransition(async () => {
      await assignResale({ resaleId, assignedToId: assignedToId === "none" ? null : assignedToId })
      toast.success("تم التحديث / Updated")
      router.refresh()
    })
  }

  function handleStatus(resaleId: number, status: string) {
    startTransition(async () => {
      await setResaleStatus({ resaleId, status })
      toast.success("تم التحديث / Updated")
      router.refresh()
    })
  }

  function handleDelete(resaleId: number) {
    startTransition(async () => {
      await deleteResale(resaleId)
      toast.success("تم الحذف / Deleted")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">سوق الإعادة / Resale Market</h1>
          <p className="text-sm text-muted-foreground">
            إدارة وحدات إعادة البيع وبيانات الملاك المشفّرة / Manage resale units and encrypted owner data
          </p>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o)
            if (!o) setPhoto(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              إضافة وحدة / Add Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة وحدة إعادة بيع / Add Resale Listing</DialogTitle>
            </DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="projectName">المشروع / Project</Label>
                  <Input id="projectName" name="projectName" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unitType">نوع الوحدة / Unit Type</Label>
                  <Select name="unitType" required>
                    <SelectTrigger id="unitType">
                      <SelectValue placeholder="اختر / Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESALE_UNIT_TYPES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {bilingualLabel(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="floor">الدور / Floor</Label>
                  <Input id="floor" name="floor" type="number" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area">المساحة (م²) / Area</Label>
                  <Input id="area" name="area" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">السعر (ج.م) / Price</Label>
                  <Input id="price" name="price" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="finishing">التشطيب / Finishing</Label>
                  <Select name="finishing">
                    <SelectTrigger id="finishing">
                      <SelectValue placeholder="اختر / Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESALE_FINISHING.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {bilingualLabel(f)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">الوصف / Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>

              <div className="space-y-1.5">
                <Label>صورة الوحدة / Unit Photo</Label>
                {photo ? (
                  <div className="relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo || "/placeholder.svg"} alt="معاينة الوحدة / Unit preview" className="h-44 w-full object-cover" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 size-7"
                      onClick={() => setPhoto(null)}
                      aria-label="إزالة الصورة / Remove photo"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                    {photoLoading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <ImagePlus className="size-6" />
                    )}
                    <span>{photoLoading ? "جارٍ المعالجة / Processing…" : "اختر صورة / Choose a photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoChange}
                      disabled={photoLoading}
                    />
                  </label>
                )}
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="mb-3 text-xs font-medium text-amber-800">
                  بيانات المالك (مشفّرة) / Owner data (encrypted)
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName">اسم المالك / Owner Name</Label>
                    <Input id="ownerName" name="ownerName" required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ownerPhone">هاتف المالك / Owner Phone</Label>
                      <Input id="ownerPhone" name="ownerPhone" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ownerNationalId">الرقم القومي / National ID</Label>
                      <Input id="ownerNationalId" name="ownerNationalId" />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  حفظ / Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">كل الوحدات / All ({initialListings.length})</TabsTrigger>
          <TabsTrigger value="pending">قيد المراجعة / Pending ({pendingListings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <ResaleGrid
            listings={initialListings}
            members={members}
            pending={pending}
            onAssign={handleAssign}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <ResaleGrid
            listings={pendingListings}
            members={members}
            pending={pending}
            onAssign={handleAssign}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResaleGrid({
  listings,
  members,
  pending,
  onAssign,
  onStatus,
  onDelete,
}: {
  listings: ResaleView[]
  members: Member[]
  pending: boolean
  onAssign: (id: number, to: string) => void
  onStatus: (id: number, status: string) => void
  onDelete: (id: number) => void
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        لا توجد وحدات / No listings
      </div>
    )
  }
  const sales = members.filter((m) => m.role === "sales")
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => {
        const unit = findBilingual(RESALE_UNIT_TYPES, l.unitType)
        const status = findBilingual(RESALE_STATUSES, l.status)
        return (
          <div key={l.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
            {l.images?.[0] ? (
              <div className="mb-3 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.images[0] || "/placeholder.svg"}
                  alt={`${l.projectName} - ${unit ? bilingualLabel(unit) : l.unitType}`}
                  className="h-36 w-full object-cover"
                />
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <p className="font-semibold leading-tight text-foreground">{l.projectName}</p>
                  <p className="text-xs text-muted-foreground">{unit ? bilingualLabel(unit) : l.unitType}</p>
                </div>
              </div>
              <Badge className={cn("shrink-0 border-0", RESALE_STATUS_STYLES[l.status])}>
                {status ? bilingualLabel(status) : l.status}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-muted-foreground">المساحة</p>
                <p className="font-medium text-foreground">{l.area || "—"}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-muted-foreground">الدور</p>
                <p className="font-medium text-foreground">{l.floor ?? "—"}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-muted-foreground">السعر</p>
                <p className="font-medium text-foreground">{l.price || "—"}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50/60 p-2 text-xs">
              <p className="flex items-center gap-1.5 text-foreground">
                <User className="size-3.5 text-amber-700" /> {l.ownerName || "—"}
              </p>
              <p className="flex items-center gap-1.5 text-foreground">
                <Phone className="size-3.5 text-amber-700" /> {l.ownerPhone || "—"}
              </p>
              {l.ownerId ? (
                <p className="flex items-center gap-1.5 text-foreground">
                  <IdCard className="size-3.5 text-amber-700" /> {l.ownerId}
                </p>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              <Select
                defaultValue={l.assignedToId ?? "none"}
                onValueChange={(v) => onAssign(l.id, v)}
                disabled={pending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="تكليف / Assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">غير مُكلَّف / Unassigned</SelectItem>
                  {sales.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Select defaultValue={l.status} onValueChange={(v) => onStatus(l.id, v)} disabled={pending}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESALE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {bilingualLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 text-rose-600"
                  disabled={pending}
                  onClick={() => onDelete(l.id)}
                  aria-label="حذف / Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
