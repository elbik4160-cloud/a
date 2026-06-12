export const STAGE_COLOR: Record<string, string> = {
  New: "#3B82F6",
  Assigned: "#3B82F6",
  Contacted: "#8B5CF6",
  FollowUp: "#F59E0B",
  Meeting: "#A855F7",
  Negotiation: "#F97316",
  Won: "#10B981",
  Lost: "#EF4444",
}

export function stageColor(stage: string): string {
  return STAGE_COLOR[stage] ?? "#3B82F6"
}

export const STAGE_LABEL: Record<string, { ar: string; en: string }> = {
  New: { ar: "جديد", en: "New" },
  Assigned: { ar: "مُكلَّف", en: "Assigned" },
  Contacted: { ar: "تم التواصل", en: "Contacted" },
  FollowUp: { ar: "متابعة", en: "Follow Up" },
  Meeting: { ar: "اجتماع", en: "Meeting" },
  Negotiation: { ar: "تفاوض", en: "Negotiation" },
  Won: { ar: "تم البيع", en: "Won" },
  Lost: { ar: "خسارة", en: "Lost" },
}

export function stageLabel(stage: string, lang: "ar" | "en"): string {
  return STAGE_LABEL[stage]?.[lang] ?? stage
}
