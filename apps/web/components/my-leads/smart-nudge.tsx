"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Clock, Phone, X } from "lucide-react"
import type { Nudge } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"

const ICONS = { flame: Flame, clock: Clock, phone: Phone } as const

export function SmartNudge({
  nudges,
  lang,
  onAction,
}: {
  nudges: Nudge[]
  lang: Lang
  onAction: (n: Nudge) => void
}) {
  const [queue, setQueue] = useState<Nudge[]>([])
  const [current, setCurrent] = useState<Nudge | null>(null)

  // refresh queue when nudges change (by id signature)
  const sig = nudges.map((n) => n.id).join(",")
  useEffect(() => {
    setQueue(nudges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  // pull next from queue
  useEffect(() => {
    if (current || queue.length === 0) return
    setCurrent(queue[0])
    setQueue((q) => q.slice(1))
  }, [current, queue])

  // auto-dismiss after 6s
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setCurrent(null), 6000)
    return () => clearTimeout(t)
  }, [current])

  const tone =
    current?.tone === "warn"
      ? { bg: "rgba(239,68,68,0.16)", border: "rgba(239,68,68,0.4)", fg: "#fca5a5" }
      : current?.tone === "success"
        ? { bg: "rgba(16,185,129,0.16)", border: "rgba(16,185,129,0.4)", fg: "#6ee7b7" }
        : { bg: "rgba(59,130,246,0.16)", border: "rgba(59,130,246,0.4)", fg: "#93c5fd" }

  const Icon = current ? (ICONS[current.icon as keyof typeof ICONS] ?? Flame) : Flame

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 320 }}
          className="pointer-events-auto fixed inset-x-3 top-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur"
          style={{ background: tone.bg, borderColor: tone.border }}
        >
          <Icon className="h-5 w-5 shrink-0" style={{ color: tone.fg }} />
          <p className="flex-1 text-sm text-white">{lang === "ar" ? current.messageAr : current.message}</p>
          {current.action && (
            <button
              onClick={() => {
                onAction(current)
                setCurrent(null)
              }}
              className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
              style={{ background: tone.border }}
            >
              {lang === "ar" ? current.actionAr : current.action}
            </button>
          )}
          <button onClick={() => setCurrent(null)} className="shrink-0 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
