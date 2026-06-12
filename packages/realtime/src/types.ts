import type { LeadDTO, UserDTO } from "@crm/shared-lib";

// كل event ليه payload type محدد
export interface LeadCreatedPayload {
  lead: LeadDTO;
  createdBy: string;
}

export interface LeadUpdatedPayload {
  lead: LeadDTO;
  updatedBy: string;
  changedFields: string[];
}

export interface LeadAssignedPayload {
  leadId: string;
  assignedTo: UserDTO;
  assignedBy: string;
}

export interface LeadStageChangedPayload {
  leadId: string;
  fromStage: string;
  toStage: string;
  changedBy: string;
}

export interface ChatMessagePayload {
  id: string;
  roomId: string;
  content: string;
  sender: Pick<UserDTO, "id" | "name" | "image">;
  sentAt: string;
}

export interface NotificationPayload {
  id: string;
  type: "lead_assigned" | "lead_updated" | "chat_message" | "system";
  title: string;
  body: string;
  link?: string;
  createdAt: string;
}

// Map من event name لـ payload type
export interface EventPayloadMap {
  "lead:created": LeadCreatedPayload;
  "lead:updated": LeadUpdatedPayload;
  "lead:assigned": LeadAssignedPayload;
  "lead:stage_changed": LeadStageChangedPayload;
  "chat:message": ChatMessagePayload;
  "notification:new": NotificationPayload;
}
