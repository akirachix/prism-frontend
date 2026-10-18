import type { Notification } from "@/types/api";
import { api } from "./apiClient";

export const notificationsService = {
  list: (
    userId: string,
    {
      unreadOnly = false,
      limit = 50,
      offset = 0,
    }: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
  ) =>
    api.get<Notification[]>("/notifications", {
      user_id: userId,
      unread_only: unreadOnly,
      limit,
      offset,
    }),

  unreadCount: (userId: string) =>
    api.get<{ user_id: string; unread: number }>("/notifications/unread-count", {
      user_id: userId,
    }),

  markRead: (notificationId: string, isRead = true) =>
    api.patch<Notification>(`/notifications/${notificationId}`, { is_read: isRead }),

  markAllRead: (userId: string) =>
    api.post<{ user_id: string; updated: number }>("/notifications/read-all", undefined, {
      user_id: userId,
    }),
};
