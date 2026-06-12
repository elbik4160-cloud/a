"use client"

import { useEffect, useState } from "react"
import { scoreColor } from "@crm/shared-lib"

export function ScoreRing({
  score,
  size = 44,
  strokeWidth = 4,
  animate = true,
}: {
  score: number
  size?: number
  strokeWidth?: number
  animate?: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const color = scoreColor(score)
  const [drawn, setDrawn] = useState(!animate)

  useEffect(() => {
    if (!animate) return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [animate])

  const offset = circumference - (drawn ? score / 100 : 0) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)" }}
        />
      </svg>
      <span
        className="absolute font-semibold"
        style={{ color, fontSize: size * 0.3, fontFamily: "var(--font-display, inherit)" }}
      >
        {score}
      </span>
    </div>
  )
}
