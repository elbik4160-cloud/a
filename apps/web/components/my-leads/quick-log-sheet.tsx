"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Smile, Meh, Frown, PhoneOff, CalendarPlus, Clock, PauseCircle, Check } from "lucide-react"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { DELAY_REASONS, bilingualLabel } from "@crm/shared-lib"

export type QuickLogResult = {
  outcome: string
  nextAction: string
  note: string
  followUpAt: string | null
  delay: { reason: string; resumeAt: string } | null
}

export function QuickLogSheet({
  open,
  lang,
  channel,
  leadName,
  onClose,
  onSave,
}: {
  open: boolean
  lang: Lang
  channel: "Call" | "WhatsApp"
  leadName: string
  onClose: () => void
  onSave: (r: QuickLogResult) => void
}) {
  const [outcome, setOutcome] = useState("")
  const [nextAction, setNextAction] = useState("")
  const [note, setNote] = useState("")
  const [followUpAt, setFollowUpAt] = useState("")
  const [delayReason, setDelayReason] = useState("Busy")
  const [delayResume, setDelayResume] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setOutcome("")
    setNextAction("")
    setNote("")
    setFollowUpAt("")
    setDelayResume("")
  }

  function handleSave() {
    setSaving(true)
    onSave({
      outcome: outcome || "Interested",
      nextAction,
      note,
      followUpAt: nextAction === "followUp" && followUpAt ? new Date(followUpAt).toISOString() : null,
      delay:
        nextAction === "delay" && delayResume
          ? { reason: delayReason, resumeAt: new Date(delayResume).toISOString() }
          : null,
    })
    setSaving(false)
    reset()
  }

  const outcomes = [
    { v: "Interested", icon: Smile, label: tr(lang, "interested"), color: "#10b981" },
    { v: "Callback", icon: Meh, label: tr(lang, "callback"), color: "#f59e0b" },
    { v: "NotInterested", icon: Frown, label: tr(lang, "notInterested"), color: "#ef4444" },
    { v: "NoAnswer", icon: PhoneOff, label: tr(lang, "noAnswer"), color: "#6b7280" },
  ]
  const steps = [
    { v: "meeting", icon: CalendarPlus, label: tr(lang, "bookMeeting") },
    { v: "followUp", icon: Clock, label: tr(lang, "followUp") },
    { v: "delay", icon: PauseCircle, label: tr(lang, "setDelay") },
    { v: "done", icon: Check, label: tr(lang, "doneForNow") },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className="cc-elevated fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl border-t border-white/10 p-5 text-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
          >
            <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-white/20" />
            <div>
              <p className="text-sm cc-text-secondary">
                {channel === "Call" ? tr(lang, "howDidItGo") : leadName}
              </p>
              <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {leadName}
              </p>
            </div>

            {/* Outcome */}
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((o) => {
                const Icon = o.icon
                const active = outcome === o.v
                return (
                  <button
                    key={o.v}
                    onClick={() => setOutcome(o.v)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: active ? `${o.color}22` : "rgba(255,255,255,0.04)",
                      borderColor: active ? `${o.color}66` : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: o.color }} />
                    {o.label}
                  </button>
                )
              })}
            </div>

            {/* Next step */}
            <div>
              <p className="mb-2 text-sm cc-text-secondary">{tr(lang, "nextStep")}</p>
              <div className="grid grid-cols-2 gap-2">
                {steps.map((s) => {
                  const Icon = s.icon
                  const active = nextAction === s.v
                  return (
                    <button
                      key={s.v}
                      onClick={() => setNextAction(s.v)}
                      className="flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all active:scale-95"
                      style={{
                        background: active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                        borderColor: active ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Icon className="h-5 w-5 text-blue-400" />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conditional inputs */}
            {(nextAction === "followUp" || nextAction === "meeting") && (
              <input
                type="datetime-local"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark]"
              />
            )}
            {nextAction === "delay" && (
              <div className="flex flex-col gap-2">
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark]"
                >
                  {DELAY_REASONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-[#162038]">
                      {bilingualLabel(r)}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={delayResume}
                  onChange={(e) => setDelayResume(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark]"
                />
              </div>
            )}

            {/* Note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={tr(lang, "quickNote")}
              className="resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="h-12 rounded-xl bg-blue-500 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            >
              {tr(lang, "saveAndNext")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
