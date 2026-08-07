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

  async markAllRead(): Promise<{ updatedCount: number }> {
    const { data } = await http.patch<{ status: "SUCCESS"; updatedCount: number }>(
      "/notifications/read-all",
    );
    return { updatedCount: data.updatedCount };
  },
};
