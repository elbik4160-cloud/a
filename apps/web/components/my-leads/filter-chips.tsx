"use client"

import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { Flame, AlarmClock, CalendarCheck, Moon, CircleCheck, LayoutGrid, type LucideIcon } from "lucide-react"

export type FilterKey = "all" | "hot" | "overdue" | "today" | "stale" | "won"

export function filterLeads(leads: EnrichedLead[], key: FilterKey): EnrichedLead[] {
  switch (key) {
    case "hot":
      return leads.filter((l) => l.meta.isHot)
    case "overdue":
      return leads.filter((l) => l.meta.isOverdue)
    case "today":
      return leads.filter(
        (l) =>
          l.meta.nextFollowUpAt &&
          new Date(l.meta.nextFollowUpAt).toDateString() === new Date().toDateString(),
      )
    case "stale":
      return leads.filter((l) => l.meta.isStale)
    case "won":
      return leads.filter((l) => l.status === "Won")
    default:
      return leads
  }
}

export function FilterChips({
  leads,
  active,
  onChange,
  lang,
}: {
  leads: EnrichedLead[]
  active: FilterKey
  onChange: (k: FilterKey) => void
  lang: Lang
}) {
  const chips: { key: FilterKey; label: string; icon?: LucideIcon }[] = [
    { key: "all", label: tr(lang, "all"), icon: LayoutGrid },
    { key: "hot", label: tr(lang, "hot"), icon: Flame },
    { key: "overdue", label: tr(lang, "overdue"), icon: AlarmClock },
    { key: "today", label: tr(lang, "today"), icon: CalendarCheck },
    { key: "stale", label: tr(lang, "stale"), icon: Moon },
    { key: "won", label: tr(lang, "won"), icon: CircleCheck },
  ]
  return (
    <div className="cc-no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {chips.map((c) => {
        const count = filterLeads(leads, c.key).length
        const isActive = active === c.key
        const Icon = c.icon
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: isActive ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
              borderColor: isActive ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
              color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
            }}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {c.label}
            <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
