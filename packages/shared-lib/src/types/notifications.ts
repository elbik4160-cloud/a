export interface NotificationDTO {
  id: number;
  userId: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: string;
  refId: string | null;
  isRead: boolean;
  createdAt: string;
}
