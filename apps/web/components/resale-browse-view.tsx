"use client"

import { useMemo, useState } from "react"
import type { ResaleView } from "@/app/actions/resale"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RESALE_UNIT_TYPES,
  RESALE_STATUSES,
  RESALE_STATUS_STYLES,
  bilingualLabel,
  findBilingual,
} from "@crm/shared-lib"
import { cn } from "@crm/shared-lib"
import { Building2, User, Phone, Lock, MessageCircle, Search } from "lucide-react"

export function ResaleBrowseView({ listings }: { listings: ResaleView[] }) {
  const [search, setSearch] = useState("")
  const [unitType, setUnitType] = useState("all")

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (unitType !== "all" && l.unitType !== unitType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!l.projectName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [listings, search, unitType])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">سوق الإعادة / Resale Market</h1>
        <p className="text-sm text-muted-foreground">
          الوحدات المتاحة والمكلّف بها / Available and assigned units
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالمشروع / Search project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={unitType} onValueChange={setUnitType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع / All types</SelectItem>
            {RESALE_UNIT_TYPES.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {bilingualLabel(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          لا توجد وحدات / No listings
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
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
                      <p className="text-xs text-muted-foreground">
                        {unit ? bilingualLabel(unit) : l.unitType}
                      </p>
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

                {l.canSeeOwner ? (
                  <div className="mt-3 space-y-1 rounded-md border border-emerald-200 bg-emerald-50/60 p-2 text-xs">
                    <p className="flex items-center gap-1.5 text-foreground">
                      <User className="size-3.5 text-emerald-700" /> {l.ownerName}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="size-3.5 text-emerald-700" /> {l.ownerPhone}
                      </p>
                      <div className="flex gap-1">
                        <a
                          href={`tel:${l.ownerPhone}`}
                          className="rounded-md bg-emerald-600 p-1.5 text-white"
                          aria-label="اتصال / Call"
                        >
                          <Phone className="size-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${l.ownerPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-green-500 p-1.5 text-white"
                          aria-label="واتساب / WhatsApp"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" />
                    <span>بيانات المالك مشفّرة / Owner data encrypted</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
