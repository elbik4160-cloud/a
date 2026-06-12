"use client"

import type { Lang } from "@crm/shared-lib"

const RTF_DAY = 86_400_000

export function relativeTime(iso: string | null, lang: Lang): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const future = diff < 0
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3_600_000)
  const days = Math.round(abs / RTF_DAY)

  if (lang === "ar") {
    if (mins < 1) return "الآن"
    if (mins < 60) return future ? `بعد ${mins} د` : `منذ ${mins} د`
    if (hours < 24) return future ? `بعد ${hours} س` : `منذ ${hours} س`
    return future ? `بعد ${days} ي` : `منذ ${days} ي`
  }
  if (mins < 1) return "now"
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`
  if (hours < 24) return future ? `in ${hours}h` : `${hours}h ago`
  return future ? `in ${days}d` : `${days}d ago`
}

export function clockTime(iso: string | null, lang: Lang): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  })
}
