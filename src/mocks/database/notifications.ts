import type { Notification } from "@/types/api";
import { MOCK_USER_ID } from "./teachers";

export function createNotifications(): Notification[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const base = { user_id: MOCK_USER_ID, case_id: "c0000000-0000-4000-8000-000000000001" };
  return [
    {
      ...base,
      notification_id: "a0000000-0000-4000-8000-000000000001",
      kind: "IEP_APPROVED",
      message: "IEP approved for Otieno.",
      read_at: null,
      created_at: minutesAgo(20),
      is_read: false,
    },
    {
      ...base,
      notification_id: "a0000000-0000-4000-8000-000000000002",
      kind: "REPORT_READY",
      message: "Report ready for Otieno",
      read_at: null,
      created_at: minutesAgo(60),
      is_read: false,
    },
    {
      ...base,
      notification_id: "a0000000-0000-4000-8000-000000000003",
      kind: "EVALUATION_UNLOCKED",
      message: "Evaluation unlocked",
      read_at: minutesAgo(90),
      created_at: minutesAgo(120),
      is_read: true,
    },
    {
      ...base,
      case_id: null,
      notification_id: "a0000000-0000-4000-8000-000000000004",
      kind: "ACTIVITY_REMINDER",
      message: "Three home activities are waiting for this week.",
      read_at: minutesAgo(60 * 20),
      created_at: minutesAgo(60 * 26),
      is_read: true,
    },
  ];
}

export const notificationStore: { items: Notification[] } = { items: createNotifications() };

export function resetNotifications() {
  notificationStore.items = createNotifications();
}

let counter = 100;

export function addNotification({
  kind,
  message,
  link = null,
  caseId = null,
}: {
  kind: string;
  message: string;
  link?: string | null;
  caseId?: string | null;
}) {
  counter += 1;
  notificationStore.items = [
    {
      notification_id: `a0000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
      user_id: MOCK_USER_ID,
      case_id: caseId,
      kind,
      message,
      link,
      read_at: null,
      created_at: new Date().toISOString(),
      is_read: false,
    },
    ...notificationStore.items,
  ];
}
