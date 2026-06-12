"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Sparkles, CalendarCheck, RefreshCcw, Building2, Send } from "lucide-react"
import type { Lang } from "@crm/shared-lib"
import { tr } from "@crm/shared-lib"
import type { EnrichedLead } from "@/app/actions/my-leads"

type Template = {
  id: string
  icon: typeof MessageCircle
  color: string
  title: { ar: string; en: string }
  /** Builds the message body with lead context. */
  body: (lead: EnrichedLead, lang: Lang) => string
}

const TEMPLATES: Template[] = [
  {
    id: "intro",
    icon: Sparkles,
    color: "#3b82f6",
    title: { ar: "تعارف أول", en: "First intro" },
    body: (l, lang) =>
      lang === "ar"
        ? `أهلاً ${l.name}، معاك من فريق المبيعات بخصوص استفسارك${l.project ? ` عن ${l.project}` : ""}. متاح نتكلم دلوقتي؟`
        : `Hi ${l.name}, this is the sales team regarding your inquiry${l.project ? ` about ${l.project}` : ""}. Is now a good time to chat?`,
  },
  {
    id: "followup",
    icon: RefreshCcw,
    color: "#f59e0b",
    title: { ar: "متابعة", en: "Follow-up" },
    body: (l, lang) =>
      lang === "ar"
        ? `أهلاً ${l.name}، بتابع معاك بخصوص ${l.project ?? "استفسارك"}. هل في أي أسئلة أقدر أساعدك فيها؟`
        : `Hi ${l.name}, following up on ${l.project ?? "your inquiry"}. Any questions I can help with?`,
  },
  {
    id: "meeting",
    icon: CalendarCheck,
    color: "#10b981",
    title: { ar: "تأكيد ميعاد", en: "Confirm meeting" },
    body: (l, lang) =>
      lang === "ar"
        ? `أهلاً ${l.name}، بأكد معاك ميعاد المقابلة بخصوص ${l.project ?? "المشروع"}. هل الميعاد مناسب ليك؟`
        : `Hi ${l.name}, confirming our meeting about ${l.project ?? "the project"}. Does the time still work for you?`,
  },
  {
    id: "units",
    icon: Building2,
    color: "#8b5cf6",
    title: { ar: "عرض وحدات", en: "Unit offers" },
    body: (l, lang) =>
      lang === "ar"
        ? `أهلاً ${l.name}، عندنا وحدات جديدة${l.project ? ` في ${l.project}` : ""} مناسبة لميزانيتك${l.budget ? ` (${l.budget})` : ""}. أبعتلك التفاصيل؟`
        : `Hi ${l.name}, we have new units${l.project ? ` in ${l.project}` : ""} matching your budget${l.budget ? ` (${l.budget})` : ""}. Want the details?`,
  },
]

function waUrl(phone: string, text?: string) {
  const num = phone.replace(/[^\d]/g, "")
  return text ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : `https://wa.me/${num}`
}

/** Bottom sheet with one-tap stage-aware WhatsApp message templates. */
export function WhatsAppTemplatesSheet({
  open,
  lead,
  lang,
  onClose,
  onSent,
}: {
  open: boolean
  lead: EnrichedLead | null
  lang: Lang
  onClose: () => void
  onSent: (lead: EnrichedLead) => void
}) {
  function send(text?: string) {
    if (!lead) return
    window.open(waUrl(lead.phone, text), "_blank", "noopener,noreferrer")
    onSent(lead)
  }

  return (
    <AnimatePresence>
      {open && lead && (
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
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className="cc-elevated fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl border-t border-white/10 p-5 text-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
          >
            <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-white/20" />
            <div>
              <p className="text-sm cc-text-secondary">{tr(lang, "waTemplatesHint")}</p>
              <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {tr(lang, "waTemplates")} — {lead.name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon
                const text = t.body(lead, lang)
                return (
                  <button
                    key={t.id}
                    onClick={() => send(text)}
                    className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/4 p-3 text-start transition-all hover:bg-white/8 active:scale-[0.98]"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${t.color}22` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: t.color, width: 18, height: 18 }} />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold">{lang === "ar" ? t.title.ar : t.title.en}</span>
                      <span className="line-clamp-2 text-xs leading-relaxed cc-text-secondary">{text}</span>
                    </span>
                    <Send className="ms-auto mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => send()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition-all active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              {tr(lang, "waBlank")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
