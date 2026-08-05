export interface Notification {
  id: string;
  message: string;
  type: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  status: "SUCCESS" | "ERROR";
  notifications?: Notification[];
  unreadCount?: number;
  message?: string;
}
