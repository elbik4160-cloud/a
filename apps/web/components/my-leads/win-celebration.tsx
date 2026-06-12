"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy } from "lucide-react"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"

export function WinCelebration({
  open,
  lang,
  leadName,
  detail,
  streak,
  onNext,
  onClose,
}: {
  open: boolean
  lang: Lang
  leadName: string
  detail: string
  streak: number
  onNext: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const end = Date.now() + 2500
    const colors = ["#10b981", "#f59e0b", "#3b82f6", "#f97316"]
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors })
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="cc-elevated fixed inset-x-4 top-1/2 z-[61] mx-auto flex max-w-sm -translate-y-1/2 flex-col items-center gap-3 rounded-3xl border border-amber-400/40 p-7 text-center text-white"
            style={{ boxShadow: "0 0 60px rgba(245,158,11,0.4)" }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/20"
            >
              <Trophy className="h-10 w-10 text-amber-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-amber-300" style={{ fontFamily: "var(--font-display)" }}>
              {tr(lang, "dealClosed")}
            </h2>
            <p className="text-lg font-semibold">{leadName}</p>
            <p className="text-sm cc-text-secondary">{detail}</p>
            {streak >= 2 && (
              <p className="text-sm font-medium text-orange-300">
                {lang === "ar" ? `أنت على ${streak} صفقات هذا الشهر!` : `You're on a ${streak}-win streak this month!`}
              </p>
            )}
            <button
              onClick={onNext}
              className="mt-2 h-11 w-full rounded-xl bg-amber-400 text-sm font-semibold text-amber-950 active:scale-95"
            >
              {tr(lang, "nextLead")} →
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
