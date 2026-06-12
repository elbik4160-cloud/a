"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { Phone, MessageCircle, CalendarCheck, ChevronUp, ChevronDown, Target } from "lucide-react"
import type { MissionData } from "@/app/actions/my-leads"
import type { Lang } from "@crm/shared-lib"
import { tr, fmtNum } from "@crm/shared-lib"

export function DailyMissionBar({ mission, lang }: { mission: MissionData; lang: Lang }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    // auto-collapse after 9am
    if (new Date().getHours() >= 9) setCollapsed(true)
    return () => cancelAnimationFrame(id)
  }, [])

  const rows = [
    { icon: Phone, label: tr(lang, "calls"), done: mission.today.calls, target: mission.daily.calls, color: "#10b981" },
    {
      icon: MessageCircle,
      label: tr(lang, "whatsapp"),
      done: mission.today.whatsapp,
      target: mission.daily.whatsapp,
      color: "#22c55e",
    },
    {
      icon: CalendarCheck,
      label: tr(lang, "meetings"),
      done: mission.today.meetings,
      target: mission.daily.meetings,
      color: "#a855f7",
    },
  ]

  const totalDone = rows.reduce((s, r) => s + Math.min(r.done, r.target), 0)
  const totalTarget = rows.reduce((s, r) => s + r.target, 0)
  const overallPct = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0

  // confetti when any row hits 100%
  useEffect(() => {
    if (!mounted) return
    const complete = rows.some((r) => r.target > 0 && r.done >= r.target)
    if (complete) {
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.3 }, scalar: 0.7 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  return (
    <div className="cc-surface rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {tr(lang, "todayMission")}
          </span>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1 text-xs cc-text-secondary transition-colors hover:text-white"
        >
          {collapsed ? tr(lang, "show") : tr(lang, "hide")}
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 flex flex-col gap-2.5">
          {rows.map((r) => {
            const pct = r.target > 0 ? Math.min(100, Math.round((r.done / r.target) * 100)) : 100
            const Icon = r.icon
            return (
              <div key={r.label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" style={{ color: r.color }} />
                <span className="w-20 shrink-0 text-xs cc-text-secondary">{r.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="cc-bar-fill h-full rounded-full"
                    style={{ width: mounted ? `${pct}%` : "0%", background: r.color }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
                  {fmtNum(lang, r.done)} / {fmtNum(lang, r.target)}
                </span>
              </div>
            )
          })}
          <div className="mt-1 flex items-center gap-3 border-t border-white/10 pt-2.5">
            <span className="w-[7rem] shrink-0 text-xs font-medium">{tr(lang, "overall")}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="cc-bar-fill h-full rounded-full bg-blue-500"
                style={{ width: mounted ? `${overallPct}%` : "0%" }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums">{overallPct}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
