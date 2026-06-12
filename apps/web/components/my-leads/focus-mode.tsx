"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { LeadCard } from "./lead-card"
import type { DeckActions } from "./deck-view"

export function FocusMode({
  open,
  leads,
  lang,
  actions,
  onClose,
}: {
  open: boolean
  leads: EnrichedLead[]
  lang: Lang
  actions: DeckActions
  onClose: () => void
}) {
  const top5 = leads.slice(0, 5)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] overflow-y-auto bg-black"
          style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #0f1629 0%, #000 70%)" }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between bg-black/40 px-4 py-3 backdrop-blur">
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {tr(lang, "focusMode")}
            </span>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:scale-90"
              aria-label={tr(lang, "exitFocus")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-20">
            {top5.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <LeadCard
                  lead={lead}
                  lang={lang}
                  onCall={() => actions.onCall(lead)}
                  onWhatsApp={() => actions.onWhatsApp(lead)}
                  onLog={() => actions.onLog(lead)}
                  onSchedule={() => actions.onSchedule(lead)}
                  onReminder={() => actions.onReminder(lead)}
                  onNote={() => actions.onNote(lead)}
                  onDelay={() => actions.onDelay(lead)}
                  onProfile={() => actions.onProfile(lead)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
