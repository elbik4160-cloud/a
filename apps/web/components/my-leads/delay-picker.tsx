"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import { DELAY_REASONS, bilingualLabel } from "@crm/shared-lib"

export function DelayPicker({
  open,
  lang,
  leadName,
  onClose,
  onConfirm,
}: {
  open: boolean
  lang: Lang
  leadName: string
  onClose: () => void
  onConfirm: (reason: string, resumeAt: string) => void
}) {
  const [reason, setReason] = useState("Busy")
  const [resume, setResume] = useState("")

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
            className="cc-elevated fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col gap-4 rounded-t-3xl border-t border-white/10 p-5 text-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {tr(lang, "setDelay")} — {leadName}
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm cc-text-secondary">{tr(lang, "reason")}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark]"
              >
                {DELAY_REASONS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#162038]">
                    {bilingualLabel(r)}
                  </option>
                ))}
              </select>
              <label className="text-sm cc-text-secondary">{tr(lang, "resumeOn")}</label>
              <input
                type="datetime-local"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white [color-scheme:dark]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="h-11 flex-1 rounded-xl bg-white/5 text-sm font-medium text-white/80 active:scale-95"
              >
                {tr(lang, "cancel")}
              </button>
              <button
                onClick={() => resume && onConfirm(reason, new Date(resume).toISOString())}
                disabled={!resume}
                className="h-11 flex-1 rounded-xl bg-blue-500 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
              >
                {tr(lang, "save")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
