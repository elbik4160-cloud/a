"use client"

import { useState } from "react"
import { CommandCards } from "@/components/my-leads/command-cards"
import { ResaleBrowseView } from "@/components/resale-browse-view"
import { ResaleAdminView } from "@/components/resale-admin-view"
import type { ResaleView } from "@/app/actions/resale"
import type { EnrichedLead, MissionData, Nudge } from "@/app/actions/my-leads"
import { useLang } from "@crm/shared-lib"
import { cn } from "@crm/shared-lib"
import { Layers, Store, Building2 } from "lucide-react"

type Member = { id: string; name: string; email: string; role: string }

type WorkspaceView = "leads" | "market" | "admin"

export function WorkspaceSwitcher({
  role,
  leads,
  mission,
  nudges,
  listings,
  members,
}: {
  role: string
  leads: EnrichedLead[]
  mission: MissionData
  nudges: Nudge[]
  listings: ResaleView[]
  members: Member[]
}) {
  const isAdmin = role === "admin"
  const [view, setView] = useState<WorkspaceView>("leads")
  const { lang } = useLang()

  const tabs: { key: WorkspaceView; ar: string; en: string; icon: typeof Layers; adminOnly?: boolean }[] = [
    { key: "leads", ar: "عملائي", en: "My Leads", icon: Layers },
    { key: "market", ar: "سوق الإعادة", en: "Resale Market", icon: Store },
    { key: "admin", ar: "إدارة الإعادة", en: "Resale Admin", icon: Building2, adminOnly: true },
  ]

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-border bg-card p-1 sm:w-auto">
        {visibleTabs.map((t) => {
          const Icon = t.icon
          const active = view === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" />
              <span>{lang === "ar" ? t.ar : t.en}</span>
            </button>
          )
        })}
      </div>

      <div>
        {view === "leads" && (
          <CommandCards initialLeads={leads} initialMission={mission} initialNudges={nudges} role={role} />
        )}
        {view === "market" && <ResaleBrowseView listings={listings} />}
        {view === "admin" && isAdmin && <ResaleAdminView initialListings={listings} members={members} />}
      </div>
    </div>
  )
}
