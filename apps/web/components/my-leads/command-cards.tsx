"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { toast } from "sonner"
import { Sparkles, SlidersHorizontal } from "lucide-react"
import type { EnrichedLead, MissionData, Nudge } from "@/app/actions/my-leads"
import { getMyLeadsEnriched, getMyMission, getMyNudges, markLeadHot } from "@/app/actions/my-leads"
import { logActivity, startDelay, updateLeadStatus } from "@/app/actions/leads"
import { useLang, tr, fmtNum } from "@crm/shared-lib"
import { ViewToggle, type ViewMode } from "./view-toggle"
import { FilterChips, filterLeads, type FilterKey } from "./filter-chips"
import { DeckView, type DeckActions } from "./deck-view"
import { GridView } from "./grid-view"
import { FeedView } from "./feed-view"
import { BoardView } from "./board-view"
import { FocusMode } from "./focus-mode"
import { DailyMissionBar } from "./daily-mission-bar"
import { SmartNudge } from "./smart-nudge"
import { QuickLogSheet, type QuickLogResult } from "./quick-log-sheet"
import { DelayPicker } from "./delay-picker"
import { WinCelebration } from "./win-celebration"
import { stageLabel } from "./stage-colors"
import { LeadDetailDrawer } from "@/components/lead-detail-drawer"
import { WhatsAppTemplatesSheet } from "./whatsapp-templates"
import "./command-cards.css"

type SheetState =
  | { kind: "none" }
  | { kind: "log"; lead: EnrichedLead; channel: "Call" | "WhatsApp" }
  | { kind: "delay"; lead: EnrichedLead }
  | { kind: "wa"; lead: EnrichedLead }

export function CommandCards({
  initialLeads,
  initialMission,
  initialNudges,
  role = "sales",
}: {
  initialLeads: EnrichedLead[]
  initialMission: MissionData
  initialNudges: Nudge[]
  role?: string
}) {
  const { lang, toggle } = useLang()
  const [leads, setLeads] = useState(initialLeads)
  const [mission] = useState(initialMission)
  const [nudges, setNudges] = useState(initialNudges)
  const [mode, setMode] = useState<ViewMode>("deck")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [focus, setFocus] = useState(false)
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" })
  const [win, setWin] = useState<{ lead: EnrichedLead; streak: number } | null>(null)
  const [openLeadId, setOpenLeadId] = useState<number | null>(null)
  const [, startTx] = useTransition()

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }, [lang])

  const refresh = useCallback(async () => {
    const [l, n] = await Promise.all([getMyLeadsEnriched(), getMyNudges()])
    setLeads(l)
    setNudges(n)
  }, [])

  const visible = filterLeads(leads, filter)

  // --- action handlers -----------------------------------------------------
  function digits(p: string | null) {
    return (p ?? "").replace(/[^\d+]/g, "")
  }

  const onCall = useCallback((lead: EnrichedLead) => {
    const phone = digits(lead.phone)
    if (phone && !phone.includes("•")) window.open(`tel:${phone}`, "_self")
    setSheet({ kind: "log", lead, channel: "Call" })
  }, [])

  const onWhatsApp = useCallback((lead: EnrichedLead) => {
    const phone = digits(lead.phone)
    // Masked numbers can't be messaged; go straight to logging.
    if (!phone || phone.includes("•")) {
      setSheet({ kind: "log", lead, channel: "WhatsApp" })
      return
    }
    setSheet({ kind: "wa", lead })
  }, [])

  const onLog = useCallback((lead: EnrichedLead) => setSheet({ kind: "log", lead, channel: "Call" }), [])
  const onDelay = useCallback((lead: EnrichedLead) => setSheet({ kind: "delay", lead }), [])
  const onProfile = useCallback(
    (lead: EnrichedLead) => setOpenLeadId(lead.id),
    [],
  )

  const onMarkHot = useCallback(
    (lead: EnrichedLead) => {
      startTx(async () => {
        const res = await markLeadHot(lead.id)
        if (res?.error) toast.error(res.error)
        else {
          toast.success(lang === "ar" ? "تم وضع علامة ساخن" : "Marked hot")
          refresh()
        }
      })
    },
    [lang, refresh],
  )

  const onSnooze = useCallback((lead: EnrichedLead) => setSheet({ kind: "delay", lead }), [])

  const onMoveStage = useCallback(
    (lead: EnrichedLead, newStage: string) => {
      // optimistic
      setLeads((cur) =>
        cur.map((l) => (l.id === lead.id ? { ...l, status: newStage, statusChangedAt: new Date() } : l)),
      )
      startTx(async () => {
        const res = await updateLeadStatus(lead.id, newStage)
        if (res?.error) {
          toast.error(res.error)
          refresh()
        } else {
          toast.success(`${tr(lang, "movedTo")} ${stageLabel(newStage, lang)}`)
          if (newStage === "Won") setWin({ lead, streak: 3 })
          refresh()
        }
      })
    },
    [lang, refresh],
  )

  function handleQuickLogSave(lead: EnrichedLead, channel: "Call" | "WhatsApp", r: QuickLogResult) {
    startTx(async () => {
      const res = await logActivity({
        leadId: lead.id,
        type: channel,
        outcome: r.outcome,
        notes: r.note,
        nextAction: r.nextAction,
        followUpAt: r.followUpAt,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      // book meeting → move stage
      if (r.nextAction === "meeting") await updateLeadStatus(lead.id, "Meeting")
      // delay path
      if (r.delay) {
        await startDelay({ leadId: lead.id, reason: r.delay.reason, resumeAt: r.delay.resumeAt })
      }
      toast.success(tr(lang, "saved"))
      setSheet({ kind: "none" })
      await refresh()
    })
  }

  function handleDelayConfirm(lead: EnrichedLead, reason: string, resumeAt: string) {
    startTx(async () => {
      const res = await startDelay({ leadId: lead.id, reason, resumeAt })
      if (res?.error) toast.error(res.error)
      else {
        toast.success(lang === "ar" ? "تم التأجيل" : "Snoozed")
        setSheet({ kind: "none" })
        await refresh()
      }
    })
  }

  function handleSchedule(lead: EnrichedLead) {
    setSheet({ kind: "log", lead, channel: "Call" })
  }

  const deckActions: DeckActions = {
    onCall,
    onWhatsApp,
    onLog,
    onSchedule: handleSchedule,
    onReminder: onLog,
    onNote: onLog,
    onDelay,
    onProfile,
    onMarkHot,
    onSwipeSnooze: onSnooze,
  }

  function handleNudgeAction(n: Nudge) {
    if (n.leadId) {
      const lead = leads.find((l) => l.id === n.leadId)
      if (lead) onCall(lead)
    }
  }

  const activeSheet = sheet

  return (
    <div className="cc-root p-3 md:p-5" dir={lang === "ar" ? "rtl" : "ltr"}>
      <SmartNudge nudges={nudges} lang={lang} onAction={handleNudgeAction} />

      {/* Header */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {tr(lang, "myLeads")}
          </h1>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs cc-text-secondary">
            {fmtNum(lang, leads.length)} {tr(lang, "leads")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={mode} onChange={setMode} lang={lang} />
          <button
            onClick={toggle}
            className="flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white"
          >
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button
            onClick={() => setFocus(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-orange-500/20 px-3 text-xs font-medium text-orange-300"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{tr(lang, "focusMode")}</span>
          </button>
        </div>
      </header>

      {/* Mission bar */}
      <div className="mb-3">
        <DailyMissionBar mission={mission} lang={lang} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2">
        <FilterChips leads={leads} active={filter} onChange={setFilter} lang={lang} />
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60"
          aria-label={tr(lang, "filters")}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <Sparkles className="h-6 w-6 text-white/40" />
          </div>
          <p className="text-base font-semibold">{tr(lang, "noLeads")}</p>
          <p className="text-sm cc-text-muted">{tr(lang, "noLeadsSub")}</p>
        </div>
      ) : mode === "deck" ? (
        <DeckView leads={visible} lang={lang} actions={deckActions} />
      ) : mode === "grid" ? (
        <GridView leads={visible} lang={lang} onCall={onCall} onLog={onLog} onOpen={onProfile} />
      ) : mode === "board" ? (
        <BoardView leads={visible} lang={lang} onOpen={onProfile} onMove={onMoveStage} />
      ) : (
        <FeedView leads={visible} lang={lang} onCall={onCall} onLog={onLog} onOpen={onProfile} />
      )}

      {/* Focus mode */}
      <FocusMode open={focus} leads={leads} lang={lang} actions={deckActions} onClose={() => setFocus(false)} />

      {/* Sheets */}
      <QuickLogSheet
        open={activeSheet.kind === "log"}
        lang={lang}
        channel={activeSheet.kind === "log" ? activeSheet.channel : "Call"}
        leadName={activeSheet.kind === "log" ? activeSheet.lead.name : ""}
        onClose={() => setSheet({ kind: "none" })}
        onSave={(r) => {
          if (activeSheet.kind === "log") handleQuickLogSave(activeSheet.lead, activeSheet.channel, r)
        }}
      />
      <WhatsAppTemplatesSheet
        open={activeSheet.kind === "wa"}
        lead={activeSheet.kind === "wa" ? activeSheet.lead : null}
        lang={lang}
        onClose={() => setSheet({ kind: "none" })}
        onSent={(lead) => setSheet({ kind: "log", lead, channel: "WhatsApp" })}
      />
      <DelayPicker
        open={activeSheet.kind === "delay"}
        lang={lang}
        leadName={activeSheet.kind === "delay" ? activeSheet.lead.name : ""}
        onClose={() => setSheet({ kind: "none" })}
        onConfirm={(reason, resumeAt) => {
          if (activeSheet.kind === "delay") handleDelayConfirm(activeSheet.lead, reason, resumeAt)
        }}
      />

      {/* Win celebration */}
      <WinCelebration
        open={!!win}
        lang={lang}
        leadName={win?.lead.name ?? ""}
        detail={win ? [win.lead.project, win.lead.budget].filter(Boolean).join(" · ") : ""}
        streak={win?.streak ?? 0}
        onNext={() => setWin(null)}
        onClose={() => setWin(null)}
      />

      {/* Lead detail drawer */}
      <LeadDetailDrawer
        leadId={openLeadId}
        open={openLeadId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setOpenLeadId(null)
            refresh()
          }
        }}
        canManage
        role={role}
      />
    </div>
  )
}
