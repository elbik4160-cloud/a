export type LeadStage = "New" | "Assigned" | "Contacted" | "FollowUp" | "Meeting" | "Negotiation" | "Won" | "Lost";

export interface LeadDTO {
  id: number;
  name: string;
  phone: string;
  phone2: string | null;
  project: string | null;
  unitType: string | null;
  budget: string | null;
  area: string | null;
  source: string;
  notes: string | null;
  status: LeadStage;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
  statusChangedAt: string;
  createdById: string;
  createdByName: string | null;
  createdAt: string;
}

export interface LeadActivityDTO {
  id: number;
  leadId: number;
  userId: string;
  userName: string;
  type: string;
  notes: string | null;
  outcome: string | null;
  nextAction: string | null;
  followUpAt: string | null;
  durationMin: number | null;
  createdAt: string;
}

export interface LeadDelayDTO {
  id: number;
  leadId: number;
  userId: string;
  reason: string;
  reasonNote: string | null;
  resumeAt: string;
  cancelledAt: string | null;
  createdAt: string;
}
