"use client"

import { Flame, Clock, Snowflake, Pause } from "lucide-react"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import type { LeadMeta } from "@crm/shared-lib"

export function SmartBadges({ meta, lang }: { meta: LeadMeta; lang: Lang }) {
  const badges: { key: string; icon: typeof Flame; label: string; bg: string; fg: string }[] = []
  if (meta.isHot)
    badges.push({ key: "hot", icon: Flame, label: tr(lang, "hot"), bg: "rgba(249,115,22,0.18)", fg: "#fb923c" })
  if (meta.isOverdue)
    badges.push({ key: "overdue", icon: Clock, label: tr(lang, "overdue"), bg: "rgba(239,68,68,0.18)", fg: "#f87171" })
  if (meta.isStale)
    badges.push({ key: "stale", icon: Snowflake, label: tr(lang, "stale"), bg: "rgba(107,114,128,0.22)", fg: "#9ca3af" })
  if (meta.isDelayed)
    badges.push({ key: "delayed", icon: Pause, label: tr(lang, "delayed"), bg: "rgba(59,130,246,0.18)", fg: "#60a5fa" })

  if (badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => {
        const Icon = b.icon
        return (
          <span
            key={b.key}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{ background: b.bg, color: b.fg }}
          >
            <Icon className="h-3 w-3" />
            {b.label}
          </span>
        )
      })}
    </div>
  )
}
