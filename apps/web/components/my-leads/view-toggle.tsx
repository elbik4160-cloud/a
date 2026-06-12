"use client"

import { motion } from "framer-motion"
import { Layers, LayoutGrid, Rows3, Columns3 } from "lucide-react"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"

export type ViewMode = "deck" | "grid" | "feed" | "board"

export function ViewToggle({
  mode,
  onChange,
  lang,
}: {
  mode: ViewMode
  onChange: (m: ViewMode) => void
  lang: Lang
}) {
  const modes: { v: ViewMode; icon: typeof Layers; label: string }[] = [
    { v: "deck", icon: Layers, label: tr(lang, "deck") },
    { v: "grid", icon: LayoutGrid, label: tr(lang, "grid") },
    { v: "feed", icon: Rows3, label: tr(lang, "feed") },
    { v: "board", icon: Columns3, label: tr(lang, "board") },
  ]
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {modes.map((m) => {
        const Icon = m.icon
        const active = mode === m.v
        return (
          <button
            key={m.v}
            onClick={() => onChange(m.v)}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}
          >
            {active && (
              <motion.div
                layoutId="cc-view-pill"
                className="absolute inset-0 rounded-full bg-blue-500"
                transition={{ type: "spring", damping: 26, stiffness: 360 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
