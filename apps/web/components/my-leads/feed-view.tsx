"use client"

import { Phone, NotebookPen } from "lucide-react"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { AvatarSphere } from "./avatar-sphere"
import { stageColor, stageLabel } from "./stage-colors"
import { clockTime, relativeTime } from "./time-format"

type Group = { key: string; label: string; labelAr: string; color: string; leads: EnrichedLead[] }

function groupLeads(leads: EnrichedLead[]): Group[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const groups: Record<string, EnrichedLead[]> = { overdue: [], today: [], week: [], later: [], none: [] }
  for (const l of leads) {
    const fu = l.meta.nextFollowUpAt ? new Date(l.meta.nextFollowUpAt) : null
    if (!fu) groups.none.push(l)
    else if (fu < now && fu < today) groups.overdue.push(l)
    else if (l.meta.isOverdue) groups.overdue.push(l)
    else if (fu < new Date(today.getTime() + 86_400_000)) groups.today.push(l)
    else if (fu < weekEnd) groups.week.push(l)
    else groups.later.push(l)
  }
  return [
    { key: "overdue", label: "Overdue", labelAr: "متأخر", color: "#ef4444", leads: groups.overdue },
    { key: "today", label: "Today", labelAr: "اليوم", color: "#f59e0b", leads: groups.today },
    { key: "week", label: "This Week", labelAr: "هذا الأسبوع", color: "#3b82f6", leads: groups.week },
    { key: "later", label: "Later", labelAr: "لاحقاً", color: "#8b5cf6", leads: groups.later },
    { key: "none", label: "No Date", labelAr: "بدون تاريخ", color: "#6b7280", leads: groups.none },
  ].filter((g) => g.leads.length > 0)
}

export function FeedView({
  leads,
  lang,
  onCall,
  onLog,
  onOpen,
}: {
  leads: EnrichedLead[]
  lang: Lang
  onCall: (l: EnrichedLead) => void
  onLog: (l: EnrichedLead) => void
  onOpen: (l: EnrichedLead) => void
}) {
  const groups = groupLeads(leads)
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <div
            className="sticky top-0 z-10 flex items-center gap-2 rounded-lg bg-[#080d1a]/90 py-1.5 backdrop-blur"
            style={{ color: g.color }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {lang === "ar" ? g.labelAr : g.label}
            </span>
            <span className="text-xs cc-text-muted">· {g.leads.length}</span>
          </div>
          {g.leads.map((lead) => {
            const sc = stageColor(lead.status)
            return (
              <div
                key={lead.id}
                onClick={() => onOpen(lead)}
                className="cc-surface relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl p-3"
              >
                <div className="relative">
                  <AvatarSphere name={lead.name} size={44} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f1629]"
                    style={{ background: sc }}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                    {lead.name}
                  </span>
                  <span className="truncate text-xs cc-text-secondary">
                    {[lead.project, stageLabel(lead.status, lang)].filter(Boolean).join(" · ")}
                  </span>
                  {lead.lastActivity && (
                    <span className="truncate text-[11px] cc-text-muted">
                      {lead.lastActivity.type} · {relativeTime(lead.lastActivity.createdAt as unknown as string, lang)}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {lead.meta.nextFollowUpAt && (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: lead.meta.isOverdue ? "#f87171" : "#fbbf24" }}
                    >
                      {clockTime(lead.meta.nextFollowUpAt, lang)}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCall(lead)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15"
                      aria-label={tr(lang, "call")}
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLog(lead)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15"
                      aria-label={tr(lang, "log")}
                    >
                      <NotebookPen className="h-3.5 w-3.5 text-blue-400" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-[3px]" style={{ width: `${lead.meta.score}%`, background: sc }} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
