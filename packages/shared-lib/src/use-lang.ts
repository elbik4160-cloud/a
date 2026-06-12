"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "ar" | "en";

type LangState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "en",
      setLang: (l) => set({ lang: l }),
      toggle: () => set({ lang: get().lang === "ar" ? "en" : "ar" }),
    }),
    { name: "crm-lang" },
  ),
);

export const T = {
  myLeads: { ar: "عملائي", en: "My Leads" },
  leads: { ar: "عميل", en: "leads" },
  focusMode: { ar: "وضع التركيز", en: "Focus Mode" },
  exitFocus: { ar: "خروج", en: "Exit" },
  deck: { ar: "مجموعة", en: "Deck" },
  grid: { ar: "شبكة", en: "Grid" },
  feed: { ar: "تدفق", en: "Feed" },
  board: { ar: "لوحة", en: "Board" },
  empty: { ar: "لا يوجد", en: "Empty" },
  movedTo: { ar: "تم النقل إلى", en: "Moved to" },
  waTemplates: { ar: "قوالب واتساب", en: "WhatsApp Templates" },
  waTemplatesHint: { ar: "اختر رسالة جاهزة أو افتح محادثة فارغة", en: "Pick a ready message or open a blank chat" },
  waBlank: { ar: "محادثة فارغة", en: "Blank chat" },
  filters: { ar: "تصفية", en: "Filters" },
  todayMission: { ar: "مهمة اليوم", en: "Today's Mission" },
  hide: { ar: "إخفاء", en: "Hide" },
  show: { ar: "إظهار", en: "Show" },
  calls: { ar: "مكالمات", en: "Calls" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  meetings: { ar: "اجتماعات", en: "Meetings" },
  overall: { ar: "الإجمالي", en: "Overall" },
  done: { ar: "مكتمل", en: "done" },
  viewStats: { ar: "الإحصائيات", en: "View Stats" },
  call: { ar: "اتصال", en: "Call" },
  log: { ar: "تسجيل", en: "Log" },
  called: { ar: "اتصلت", en: "Called" },
  snooze: { ar: "تأجيل", en: "Snooze" },
  markHot: { ar: "عميل ساخن", en: "Mark Hot" },
  skip: { ar: "تخطي", en: "Skip" },
  howDidItGo: { ar: "كيف كانت المكالمة؟", en: "How did it go?" },
  nextStep: { ar: "الخطوة التالية؟", en: "Next step?" },
  interested: { ar: "مهتم", en: "Interested" },
  callback: { ar: "يرد لاحقاً", en: "Callback" },
  noAnswer: { ar: "لا يرد", en: "No answer" },
  notInterested: { ar: "غير مهتم", en: "Not interested" },
  bookMeeting: { ar: "حجز اجتماع", en: "Book meeting" },
  followUp: { ar: "متابعة", en: "Follow up" },
  setDelay: { ar: "تأجيل", en: "Set delay" },
  doneForNow: { ar: "انتهيت", en: "Done for now" },
  addNote: { ar: "إضافة ملاحظة", en: "Add note" },
  quickNote: { ar: "ملاحظة سريعة...", en: "Quick note..." },
  saveAndNext: { ar: "حفظ والتالي", en: "Save & Next Lead" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  dealClosed: { ar: "تم البيع!", en: "Deal Closed!" },
  winStreak: { ar: "أنت على ٣ صفقات هذا الشهر!", en: "You're on a 3-win streak this month!" },
  nextLead: { ar: "العميل التالي", en: "Next Lead" },
  share: { ar: "مشاركة", en: "Share" },
  hot: { ar: "ساخن", en: "HOT" },
  overdue: { ar: "متأخر", en: "OVERDUE" },
  stale: { ar: "راكد", en: "STALE" },
  delayed: { ar: "مؤجل", en: "DELAYED" },
  noLeads: { ar: "لا يوجد عملاء", en: "No leads yet" },
  noLeadsSub: { ar: "سيظهر العملاء المكلفون هنا", en: "Assigned leads will appear here" },
  all: { ar: "الكل", en: "All" },
  today: { ar: "اليوم", en: "Today" },
  won: { ar: "مكتمل", en: "Won" },
  reason: { ar: "السبب", en: "Reason" },
  resumeOn: { ar: "استئناف في", en: "Resume on" },
  noDate: { ar: "بدون تاريخ", en: "No date" },
  thisWeek: { ar: "هذا الأسبوع", en: "This week" },
  later: { ar: "لاحقاً", en: "Later" },
  viewProfile: { ar: "الملف الكامل", en: "View Full Profile" },
  scheduleMeeting: { ar: "تحديد اجتماع", en: "Schedule Meeting" },
  setReminder: { ar: "تذكير", en: "Set Reminder" },
  quickActions: { ar: "إجراءات سريعة", en: "Quick" },
  logActivity: { ar: "تسجيل نشاط", en: "Log Activity" },
  selectLead: { ar: "اختر العميل", en: "Select lead" },
  setFollowup: { ar: "تحديد متابعة", en: "Set Follow-up" },
  saved: { ar: "تم الحفظ", en: "Saved" },
} as const;

export type TKey = keyof typeof T;

export function tr(lang: Lang, key: TKey): string {
  return T[key][lang];
}

export function fmtNum(lang: Lang, n: number): string {
  return n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
}
