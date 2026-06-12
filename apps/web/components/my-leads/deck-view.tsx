"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { Check, Pause, Flame, SkipForward } from "lucide-react"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr, fmtNum } from "@crm/shared-lib"
import { LeadCard } from "./lead-card"

export type DeckActions = {
  onCall: (l: EnrichedLead) => void
  onWhatsApp: (l: EnrichedLead) => void
  onLog: (l: EnrichedLead) => void
  onSchedule: (l: EnrichedLead) => void
  onReminder: (l: EnrichedLead) => void
  onNote: (l: EnrichedLead) => void
  onDelay: (l: EnrichedLead) => void
  onProfile: (l: EnrichedLead) => void
  onMarkHot: (l: EnrichedLead) => void
  onSwipeSnooze: (l: EnrichedLead) => void
}

export function DeckView({
  leads,
  lang,
  actions,
}: {
  leads: EnrichedLead[]
  lang: Lang
  actions: DeckActions
}) {
  const [index, setIndex] = useState(0)
  const rtl = lang === "ar"

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  // overlay opacities
  const rightOpacity = useTransform(x, [40, 160], [0, 1])
  const leftOpacity = useTransform(x, [-160, -40], [1, 0])

  const top = leads[index]
  const peek1 = leads[index + 1]
  const peek2 = leads[index + 2]

  function advance() {
    setIndex((i) => Math.min(i + 1, leads.length))
    x.set(0)
  }

  // In RTL, swiping right means snooze; LTR right means called.
  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
    const dx = info.offset.x
    const dy = info.offset.y
    const THRESH = 120
    if (dy < -THRESH && Math.abs(dx) < THRESH) {
      // swipe up → hot
      if (top) actions.onMarkHot(top)
      x.set(0)
      return
    }
    if (dx > THRESH) {
      if (top) (rtl ? actions.onSwipeSnooze : actions.onCall)(top)
      advance()
    } else if (dx < -THRESH) {
      if (top) (rtl ? actions.onCall : actions.onSwipeSnooze)(top)
      advance()
    } else {
      x.set(0)
    }
  }

  if (!top) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Check className="h-10 w-10 text-emerald-400" />
        <p className="text-lg font-semibold">{lang === "ar" ? "أنجزت كل البطاقات!" : "All caught up!"}</p>
        <button
          onClick={() => setIndex(0)}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white"
        >
          {lang === "ar" ? "إعادة" : "Restart"}
        </button>
      </div>
    )
  }

  const calledLabel = rtl ? tr(lang, "snooze") : tr(lang, "called")
  const snoozeLabel = rtl ? tr(lang, "called") : tr(lang, "snooze")

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[440px] w-full max-w-md">
        {/* peek cards */}
        {peek2 && (
          <div
            className="cc-surface absolute inset-x-4 top-6 h-full rounded-2xl opacity-40"
            style={{ transform: "scale(0.9)" }}
          />
        )}
        {peek1 && (
          <div
            className="cc-surface absolute inset-x-2 top-3 h-full rounded-2xl opacity-70"
            style={{ transform: "scale(0.95)" }}
          />
        )}

        {/* top card */}
        <AnimatePresence>
          <motion.div
            key={top.id}
            className="absolute inset-0 touch-none"
            style={{ x, rotate }}
            drag
            dragSnapToOrigin
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            {/* swipe overlays */}
            <motion.div
              style={{ opacity: rightOpacity }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            >
              <span
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-bold"
                style={{
                  background: rtl ? "rgba(59,130,246,0.25)" : "rgba(16,185,129,0.25)",
                  color: rtl ? "#60a5fa" : "#34d399",
                }}
              >
                {rtl ? <Pause className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                {calledLabel}
              </span>
            </motion.div>
            <motion.div
              style={{ opacity: leftOpacity }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            >
              <span
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-bold"
                style={{
                  background: rtl ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)",
                  color: rtl ? "#34d399" : "#60a5fa",
                }}
              >
                {rtl ? <Check className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                {snoozeLabel}
              </span>
            </motion.div>

            <LeadCard
              lead={top}
              lang={lang}
              onCall={() => actions.onCall(top)}
              onWhatsApp={() => actions.onWhatsApp(top)}
              onLog={() => actions.onLog(top)}
              onSchedule={() => actions.onSchedule(top)}
              onReminder={() => actions.onReminder(top)}
              onNote={() => actions.onNote(top)}
              onDelay={() => actions.onDelay(top)}
              onProfile={() => actions.onProfile(top)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* quick swipe buttons (accessible fallback) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            actions.onSwipeSnooze(top)
            advance()
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 active:scale-90"
          aria-label={tr(lang, "snooze")}
        >
          <Pause className="h-5 w-5" />
        </button>
        <button
          onClick={() => actions.onMarkHot(top)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 active:scale-90"
          aria-label={tr(lang, "markHot")}
        >
          <Flame className="h-6 w-6" />
        </button>
        <button
          onClick={() => {
            actions.onCall(top)
            advance()
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 active:scale-90"
          aria-label={tr(lang, "called")}
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={advance}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/50 active:scale-90"
          aria-label={tr(lang, "skip")}
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {leads.slice(0, Math.min(leads.length, 10)).map((_, i) => (
            <span key={i} className={`cc-dot ${i === index ? "cc-dot-active" : ""}`} />
          ))}
        </div>
        <span className="text-xs cc-text-secondary">
          {fmtNum(lang, index + 1)} / {fmtNum(lang, leads.length)}
        </span>
      </div>
    </div>
  )
}
