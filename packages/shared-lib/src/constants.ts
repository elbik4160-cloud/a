export const CLIENT_STATUSES = [
  { value: "interested", label: "مهتم" },
  { value: "follow_up", label: "متابعة لاحقاً" },
  { value: "no_answer", label: "لم يرد" },
  { value: "not_interested", label: "غير مهتم" },
  { value: "closed_won", label: "تم الإغلاق (نجاح)" },
  { value: "closed_lost", label: "خسارة" },
  { value: "wrong_number", label: "رقم خاطئ" },
] as const;
