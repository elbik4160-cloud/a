// Channel naming — موحد بين كل الـ apps
export const CHANNELS = {
  // كل أعضاء الـ workspace يشتركوا هنا
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,

  // notifications خاصة بـ user معين
  user: (userId: string) => `user:${userId}`,

  // chat room معين
  chat: (roomId: string) => `chat:${roomId}`,

  // lead معين (للـ detail view)
  lead: (leadId: string) => `lead:${leadId}`,
} as const;
