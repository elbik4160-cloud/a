// أسماء الـ events موحدة بين Web وMobile والـ Backend
export const EVENTS = {
  // Leads
  LEAD_CREATED:    "lead:created",
  LEAD_UPDATED:    "lead:updated",
  LEAD_ASSIGNED:   "lead:assigned",
  LEAD_STAGE_CHANGED: "lead:stage_changed",
  LEAD_DELETED:    "lead:deleted",

  // Pipeline
  PIPELINE_UPDATED: "pipeline:updated",

  // Chat
  CHAT_MESSAGE:    "chat:message",
  CHAT_TYPING:     "chat:typing",

  // Notifications
  NOTIFICATION_NEW: "notification:new",

  // Users / Presence
  USER_ONLINE:     "user:online",
  USER_OFFLINE:    "user:offline",

  // Queue
  QUEUE_UPDATED:   "queue:updated",
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
