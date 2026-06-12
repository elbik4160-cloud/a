"use client"

import { Phone, NotebookPen } from "lucide-react"
import { motion } from "framer-motion"
import type { EnrichedLead } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { AvatarSphere } from "./avatar-sphere"
import { ScoreRing } from "./score-ring"
import { SmartBadges } from "./smart-badges"
import { stageColor, stageLabel } from "./stage-colors"

export function GridView({
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
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {leads.map((lead, i) => {
        const sc = stageColor(lead.status)
        return (
          <motion.div
            layout
            key={lead.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), type: "spring", damping: 20, stiffness: 280 }}
            onClick={() => onOpen(lead)}
            className={`cc-surface relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl p-3 ${lead.meta.isHot ? "cc-hot" : ""} ${lead.meta.isStale ? "cc-stale" : ""}`}
            style={{ borderTop: `2px solid ${sc}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <AvatarSphere name={lead.name} size={36} />
              <ScoreRing score={lead.meta.score} size={34} strokeWidth={3} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {lead.name}
              </span>
              <span className="text-[10px]" style={{ color: sc }}>
                {stageLabel(lead.status, lang)}
              </span>
            </div>
            {lead.budget && <span className="text-sm font-semibold cc-text-secondary">{lead.budget}</span>}
            <SmartBadges meta={lead.meta} lang={lang} />
            <div className="mt-auto flex gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCall(lead)
                }}
                className="flex h-8 flex-1 items-center justify-center rounded-lg bg-emerald-500/15"
                aria-label="Call"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLog(lead)
                }}
                className="flex h-8 flex-1 items-center justify-center rounded-lg bg-blue-500/15"
                aria-label="Log"
              >
                <NotebookPen className="h-3.5 w-3.5 text-blue-400" />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
