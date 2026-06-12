"use client"

import type { CSSProperties } from "react"

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Deterministic gradient sphere generated from the lead's name. No two alike. */
export function generateAvatarStyle(name: string): CSSProperties {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  const hue2 = (hue + 40) % 360
  return {
    background: `radial-gradient(circle at 35% 35%, hsl(${hue}, 80%, 65%), hsl(${hue2}, 60%, 35%))`,
    boxShadow: `0 4px 20px hsla(${hue}, 70%, 50%, 0.35)`,
  }
}

export function AvatarSphere({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        ...generateAvatarStyle(name),
        width: size,
        height: size,
        fontSize: size * 0.36,
        fontFamily: "var(--font-display, inherit)",
      }}
    >
      {initialsOf(name)}
    </div>
  )
}
