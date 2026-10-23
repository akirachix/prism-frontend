import { query, request } from "@/lib/api";

export interface Notification {
  notification_id: string;
  user_id: string;
  case_id: string | null;
  kind: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: (userId: string) =>
    request<Notification[]>(`/notifications${query({ user_id: userId })}`),
  unreadCount: (userId: string) =>
    request<{ user_id: string; unread: number }>(
      `/notifications/unread-count${query({ user_id: userId })}`,
    ),
  markRead: (notificationId: string) =>
    request<Notification>(`/notifications/${notificationId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_read: true }),
    }),
  markAllRead: (userId: string) =>
    request<{ user_id: string; updated: number }>(
      `/notifications/read-all${query({ user_id: userId })}`,
      { method: "POST" },
    ),
};
