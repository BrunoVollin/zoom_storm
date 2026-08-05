import { http } from "@/lib/http";
import type { NotificationsListResponse } from "@/types/notification";

export const notificationService = {
  async list(): Promise<NotificationsListResponse> {
    const { data } = await http.get<NotificationsListResponse>("/notifications");
    return data;
  },

  async markRead(id: string): Promise<void> {
    await http.patch(`/notifications/${id}/read`);
  },
};
