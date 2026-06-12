export interface ChatMessageDTO {
  id: number;
  userId: string;
  email: string;
  name: string;
  role: string;
  messageText: string;
  isDeleted: boolean;
  createdAt: string;
}
