"use client"

import {
  Phone,
  MessageCircle,
  NotebookPen,
  MoreHorizontal,
  Building2,
  Banknote,
  CalendarClock,
  CalendarPlus,
  BellPlus,
  User,
  PauseCircle,
} from "lucide-react"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { AvatarSphere } from "./avatar-sphere"
import { ScoreRing } from "./score-ring"
import { SmartBadges } from "./smart-badges"
import { stageColor, stageLabel } from "./stage-colors"
import { relativeTime, clockTime } from "./time-format"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ACTIVITY_AR: Record<string, string> = {
  Call: "اتصال",
  WhatsApp: "واتساب",
  Meeting: "اجتماع",
  Email: "بريد",
  SiteVisit: "زيارة",
  Note: "ملاحظة",
}

export function LeadCard({
  lead,
  lang,
  onCall,
  onWhatsApp,
  onLog,
  onSchedule,
  onReminder,
  onNote,
  onDelay,
  onProfile,
}: {
  lead: EnrichedLead
  lang: Lang
  onCall: () => void
  onWhatsApp: () => void
  onLog: () => void
  onSchedule: () => void
  onReminder: () => void
  onNote: () => void
  onDelay: () => void
  onProfile: () => void
}) {
  const sc = stageColor(lead.status)
  const meta = lead.meta
  const fuColor = meta.isOverdue ? "#f87171" : meta.nextFollowUpAt ? "#fbbf24" : "rgba(255,255,255,0.4)"

  const lastActivityText = lead.lastActivity
    ? lang === "ar"
      ? `${ACTIVITY_AR[lead.lastActivity.type] ?? lead.lastActivity.type} · ${relativeTime(lead.lastActivity.createdAt as unknown as string, lang)}${lead.lastActivity.outcome ? ` — ${lead.lastActivity.outcome}` : ""}`
      : `${lead.lastActivity.type} · ${relativeTime(lead.lastActivity.createdAt as unknown as string, lang)}${lead.lastActivity.outcome ? ` — ${lead.lastActivity.outcome}` : ""}`
    : lang === "ar"
      ? "لا نشاط بعد"
      : "No activity yet"

  return (
    <div
      className={`cc-surface relative flex w-full flex-col overflow-hidden rounded-2xl ${meta.isHot ? "cc-hot" : ""} ${meta.isStale ? "cc-stale" : ""}`}
      style={{ borderColor: meta.isHot ? "rgba(249,115,22,0.4)" : undefined }}
    >
      {/* Stage ribbon */}
      <div className="h-[3px] w-full" style={{ background: sc }} />

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarSphere name={lead.name} size={52} />
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {lead.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${sc}22`, color: sc }}
                >
                  {stageLabel(lead.status, lang)}
                </span>
                {lead.source && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] cc-text-secondary">
                    {lead.source}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ScoreRing score={meta.score} size={46} />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2">
          {(lead.project || lead.unitType) && (
            <div className="flex items-center gap-2 text-sm cc-text-secondary">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {[lead.project, lead.unitType].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {lead.budget && (
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 shrink-0" style={{ color: sc }} />
              <span className="text-xl font-semibold" style={{ color: sc, fontFamily: "var(--font-display)" }}>
                {lead.budget}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs cc-text-muted">
            {lastActivityText}
          </div>
          {meta.nextFollowUpAt && (
            <div className="flex items-center gap-2 text-xs" style={{ color: fuColor }}>
              <CalendarClock className="h-3.5 w-3.5" />
              {clockTime(meta.nextFollowUpAt, lang)}
            </div>
          )}
        </div>

        <SmartBadges meta={meta} lang={lang} />

        {/* Footer actions */}
        <div className="mt-1 flex items-center gap-2">
          <ActionBtn icon={Phone} label={tr(lang, "call")} onClick={onCall} accent="#10b981" />
          <ActionBtn icon={MessageCircle} label={tr(lang, "whatsapp")} onClick={onWhatsApp} accent="#22c55e" />
          <ActionBtn icon={NotebookPen} label={tr(lang, "log")} onClick={onLog} accent="#3b82f6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-colors hover:bg-white/10"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="cc-elevated border-white/10 text-white">
              <DropdownMenuItem onClick={onSchedule} className="gap-2 focus:bg-white/10 focus:text-white">
                <CalendarPlus className="h-4 w-4" /> {tr(lang, "scheduleMeeting")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReminder} className="gap-2 focus:bg-white/10 focus:text-white">
                <BellPlus className="h-4 w-4" /> {tr(lang, "setReminder")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNote} className="gap-2 focus:bg-white/10 focus:text-white">
                <NotebookPen className="h-4 w-4" /> {tr(lang, "addNote")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelay} className="gap-2 focus:bg-white/10 focus:text-white">
                <PauseCircle className="h-4 w-4" /> {tr(lang, "setDelay")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onProfile} className="gap-2 focus:bg-white/10 focus:text-white">
                <User className="h-4 w-4" /> {tr(lang, "viewProfile")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: typeof Phone
  label: string
  onClick: () => void
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-white/90 transition-all active:scale-95"
      style={{ background: `${accent}22`, border: `1px solid ${accent}33` }}
    >
      <Icon className="h-4 w-4" style={{ color: accent }} />
      {label}
    </button>
  )
}
