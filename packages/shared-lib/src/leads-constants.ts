export type Bilingual = { value: string; ar: string; en: string };

export const PIPELINE_STAGES: Bilingual[] = [
  { value: "New", ar: "جديد", en: "New" },
  { value: "Assigned", ar: "مُعين", en: "Assigned" },
  { value: "Contacted", ar: "تم التواصل", en: "Contacted" },
  { value: "FollowUp", ar: "متابعة", en: "Follow Up" },
  { value: "Meeting", ar: "اجتماع", en: "Meeting" },
  { value: "Negotiation", ar: "تفاوض", en: "Negotiation" },
  { value: "Won", ar: "تم البيع", en: "Won" },
  { value: "Lost", ar: "خسارة", en: "Lost" },
];

export const STAGE_STYLES: Record<string, { dot: string; badge: string }> = {
  New: { dot: "bg-sky-500", badge: "bg-sky-100 text-sky-700" },
  Assigned: { dot: "bg-cyan-500", badge: "bg-cyan-100 text-cyan-700" },
  Contacted: { dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  FollowUp: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  Meeting: { dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
  Negotiation: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  Won: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  Lost: { dot: "bg-rose-500", badge: "bg-rose-100 text-rose-700" },
};

export const LEAD_SOURCES: Bilingual[] = [
  { value: "Facebook", ar: "فيسبوك", en: "Facebook" },
  { value: "Instagram", ar: "انستجرام", en: "Instagram" },
  { value: "Google", ar: "جوجل", en: "Google" },
  { value: "Referral", ar: "ترشيح", en: "Referral" },
  { value: "WalkIn", ar: "زيارة", en: "Walk-in" },
  { value: "Website", ar: "الموقع", en: "Website" },
  { value: "Other", ar: "أخرى", en: "Other" },
];

export const ACTIVITY_TYPES: Bilingual[] = [
  { value: "Call", ar: "مكالمة", en: "Call" },
  { value: "WhatsApp", ar: "واتساب", en: "WhatsApp" },
  { value: "Meeting", ar: "اجتماع", en: "Meeting" },
  { value: "Email", ar: "بريد", en: "Email" },
  { value: "Note", ar: "ملاحظة", en: "Note" },
];

export const DELAY_REASONS: Bilingual[] = [
  { value: "Traveling", ar: "مسافر", en: "Traveling" },
  { value: "Busy", ar: "مشغول", en: "Busy" },
  { value: "Thinking", ar: "يفكر", en: "Considering" },
  { value: "Financing", ar: "تمويل", en: "Arranging finance" },
  { value: "Other", ar: "أخرى", en: "Other" },
];

export const RESALE_UNIT_TYPES: Bilingual[] = [
  { value: "Apartment", ar: "شقة", en: "Apartment" },
  { value: "Villa", ar: "فيلا", en: "Villa" },
  { value: "Shop", ar: "محل", en: "Shop" },
  { value: "Office", ar: "مكتب", en: "Office" },
  { value: "Duplex", ar: "دوبلكس", en: "Duplex" },
  { value: "Penthouse", ar: "بنتهاوس", en: "Penthouse" },
];

export const RESALE_FINISHING: Bilingual[] = [
  { value: "Full", ar: "تشطيب كامل", en: "Full" },
  { value: "Semi", ar: "نصف تشطيب", en: "Semi" },
  { value: "Raw", ar: "خام", en: "Raw" },
];

export const RESALE_STATUSES: Bilingual[] = [
  { value: "Active", ar: "نشط", en: "Active" },
  { value: "Pending", ar: "قيد المراجعة", en: "Pending" },
  { value: "Assigned", ar: "مُكلَّف", en: "Assigned" },
  { value: "Sold", ar: "مباع", en: "Sold" },
  { value: "Withdrawn", ar: "مسحوب", en: "Withdrawn" },
];

export const RESALE_STATUS_STYLES: Record<string, string> = {
  Active: "bg-sky-100 text-sky-700",
  Pending: "bg-amber-100 text-amber-700",
  Assigned: "bg-indigo-100 text-indigo-700",
  Sold: "bg-emerald-100 text-emerald-700",
  Withdrawn: "bg-rose-100 text-rose-700",
};

export function bilingualLabel(b: Bilingual | undefined): string {
  if (!b) return "";
  return `${b.ar} / ${b.en}`;
}

export function findBilingual(list: Bilingual[], value: string): Bilingual | undefined {
  return list.find((b) => b.value === value);
}
