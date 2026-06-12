import type { Lead, LeadActivity, LeadDelay } from "@crm/db";

export type LeadMeta = {
  score: number;
  priority: "High" | "Medium" | "Low";
  isHot: boolean;
  isStale: boolean;
  isOverdue: boolean;
  isDelayed: boolean;
  lastActivityAt: string | null;
  nextFollowUpAt: string | null;
  activityCount: number;
  urgencyRank: number;
  breakdown: { label: string; labelAr: string; value: number; max: number }[];
};

const STAGE_WEIGHT: Record<string, number> = {
  New: 8,
  Assigned: 10,
  Contacted: 16,
  FollowUp: 20,
  Meeting: 26,
  Negotiation: 35,
  Won: 35,
  Lost: 0,
};

function parseBudget(budget: string | null): number {
  if (!budget) return 0;
  const digits = budget.replace(/[^ \d.]/g, "");
  const n = Number.parseFloat(digits);
  if (Number.isNaN(n)) return 0;
  if (budget.toLowerCase().includes("m") || n < 1000) return Math.min(n, 50);
  return Math.min(n / 1_000_000, 50);
}

export function computeLeadMeta(
  lead: Lead,
  activities: LeadActivity[],
  activeDelay: LeadDelay | null,
): LeadMeta {
  const now = Date.now();
  const stage = STAGE_WEIGHT[lead.status] ?? 8;
  const activityCount = activities.length;
  const activityScore = Math.min(activityCount * 2.5, 25);
  const lastActivity = activities[0] ?? null;
  const lastActivityAt = lastActivity?.createdAt ? new Date(lastActivity.createdAt).toISOString() : null;
  let recencyScore = 0;
  let daysSince = Infinity;
  if (lastActivity?.createdAt) {
    daysSince = (now - new Date(lastActivity.createdAt).getTime()) / 86_400_000;
    recencyScore = Math.max(0, 20 - (daysSince / 14) * 20);
  }
  const budgetScore = Math.min(parseBudget(lead.budget) / 5, 10);
  const priority = derivePriority(lead);
  const priorityBonus = priority === "High" ? 10 : priority === "Medium" ? 5 : 0;
  const isDelayed = Boolean(activeDelay && !activeDelay.cancelledAt);
  const delayPenalty = isDelayed ? -10 : 0;
  let score = stage + activityScore + recencyScore + budgetScore + priorityBonus + delayPenalty;
  if (lead.status === "Lost") score = Math.min(score, 15);
  score = Math.max(0, Math.min(100, Math.round(score)));
  let nextFollowUpAt: string | null = null;
  const followUps = activities
    .filter((a) => a.followUpAt)
    .map((a) => new Date(a.followUpAt as unknown as string).getTime())
    .sort((a, b) => a - b);
  const futureFu = followUps.filter((t) => t >= now);
  const pastFu = followUps.filter((t) => t < now);
  if (futureFu.length > 0) nextFollowUpAt = new Date(Math.min(...futureFu)).toISOString();
  else if (pastFu.length > 0) nextFollowUpAt = new Date(Math.max(...pastFu)).toISOString();
  const isOverdue = nextFollowUpAt ? new Date(nextFollowUpAt).getTime() < now : false;
  const isStale = daysSince >= 7 && lead.status !== "Won" && lead.status !== "Lost";
  const isHot = score >= 85 && lead.status !== "Lost";
  let urgencyRank = 5;
  if (isOverdue) urgencyRank = 0;
  else if (nextFollowUpAt && isToday(nextFollowUpAt)) urgencyRank = 1;
  else if (isHot) urgencyRank = 2;
  else if (priority === "High") urgencyRank = 3;
  else if (daysSince < 3) urgencyRank = 4;

  return {
    score,
    priority,
    isHot,
    isStale,
    isOverdue,
    isDelayed,
    lastActivityAt,
    nextFollowUpAt,
    activityCount,
    urgencyRank,
    breakdown: [
      { label: "Stage", labelAr: "المرحلة", value: Math.round(stage), max: 35 },
      { label: "Activity", labelAr: "النشاط", value: Math.round(activityScore), max: 25 },
      { label: "Recency", labelAr: "الحداثة", value: Math.round(recencyScore), max: 20 },
      { label: "Budget", labelAr: "الميزانية", value: Math.round(budgetScore), max: 10 },
      { label: "Priority", labelAr: "الأولوية", value: priorityBonus, max: 10 },
      { label: "Delay", labelAr: "التأجيل", value: delayPenalty, max: 0 },
    ],
  };
}

export function derivePriority(lead: Lead): "High" | "Medium" | "Low" {
  const m = lead.notes?.match(/\[P:(High|Medium|Low)\]/);
  if (m) return m[1] as "High" | "Medium" | "Low";
  return "Medium";
}

export function setPriorityMarker(notes: string | null, priority: "High" | "Medium" | "Low"): string {
  const base = (notes ?? "").replace(/\s*\[P:(High|Medium|Low)\]/g, "").trim();
  return `${base} [P:${priority}]`.trim();
}

export function stripPriorityMarker(notes: string | null): string {
  return (notes ?? "").replace(/\s*\[P:(High|Medium|Low)\]/g, "").trim();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}
