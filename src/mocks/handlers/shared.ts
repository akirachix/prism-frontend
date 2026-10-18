import { HttpResponse, http } from "msw";

import { API_BASE_URL } from "@/config";
import { bodyOf } from "../requestBody";
import { notificationStore } from "../database/notifications";
import { childForParent, signedInParent } from "../database/parents";
import {
  allStudents,
  currentTodos,
  details,
  listStatusOf,
  nextCaseId,
  studentRow,
} from "../database/students";

const url = (path: string) => `${API_BASE_URL}${path}`;
const notFound = () => HttpResponse.json({ detail: "Student not found." }, { status: 404 });
const notSignedIn = () => HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });

export const handlers = [
  http.get(`${API_BASE_URL}/teachers/me/students`, () =>
    HttpResponse.json(allStudents().map(studentRow)),
  ),

  http.get<{ id: string }>(`${API_BASE_URL}/teachers/me/students/:id`, ({ params }) =>
    details[params.id]
      ? HttpResponse.json({ ...details[params.id], ...listStatusOf(details[params.id].case) })
      : notFound(),
  ),

  http.post<{ id: string }>(
    `${API_BASE_URL}/teachers/me/students/:id/parent/invite`,
    ({ params }) => {
      const d = details[params.id];
      if (!d) return notFound();
      if (!d.parent)
        return HttpResponse.json({ detail: "This student has no parent yet." }, { status: 404 });
      if (d.parent.account_status === "signed_in") {
        return HttpResponse.json({ detail: "The parent has already signed in." }, { status: 409 });
      }
      const invitedAt = new Date().toISOString();
      details[params.id] = { ...d, parent: { ...d.parent, invited_at: invitedAt } };
      return HttpResponse.json({ sent: true, invited_at: invitedAt });
    },
  ),

  http.get(`${API_BASE_URL}/todos`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const limit = Number(params.get("limit")) || 50;
    const category = params.get("category");
    return HttpResponse.json(
      currentTodos()
        .filter((t) => !category || t.category === category)
        .slice(0, limit),
    );
  }),

  http.post(`${API_BASE_URL}/cases`, async ({ request }) => {
    const { student_id: id } = await bodyOf(request);
    if (!details[id]) return notFound();
    if (details[id].case?.status === "open") {
      return HttpResponse.json(
        { detail: "This student already has an open case." },
        { status: 409 },
      );
    }
    details[id] = {
      ...details[id],
      case: {
        case_id: nextCaseId(),
        status: "open",
        started_at: new Date().toISOString(),
        teacher_screening: "not_started",
        parent_screening: "not_started",
        plan: "locked",
        plan_approved_at: null,
        six_week_check_at: null,
        six_week_check_done: false,
      },
    };
    return HttpResponse.json(details[id].case, { status: 201 });
  }),

  http.get(url("/parents/me/children"), ({ request }) => {
    const parent = signedInParent(request);
    if (!parent) return notSignedIn();
    return HttpResponse.json(parent.children.map(childForParent).filter(Boolean));
  }),

  http.get(url("/notifications"), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const userId = params.get("user_id");
    const unreadOnly = params.get("unread_only") === "true";
    const limit = Number(params.get("limit")) || 50;
    const offset = Number(params.get("offset")) || 0;
    const rows = notificationStore.items
      .filter((n) => !userId || n.user_id === userId)
      .filter((n) => !unreadOnly || !n.is_read)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(offset, offset + limit);
    return HttpResponse.json(rows);
  }),

  http.get(url("/notifications/unread-count"), ({ request }) => {
    const userId = new URL(request.url).searchParams.get("user_id");
    const unread = notificationStore.items.filter((n) => n.user_id === userId && !n.is_read).length;
    return HttpResponse.json({ user_id: userId, unread });
  }),

  http.post(url("/notifications/read-all"), ({ request }) => {
    const userId = new URL(request.url).searchParams.get("user_id");
    let updated = 0;
    const now = new Date().toISOString();
    notificationStore.items = notificationStore.items.map((n) => {
      if (n.user_id !== userId || n.is_read) return n;
      updated += 1;
      return { ...n, read_at: now, is_read: true };
    });
    return HttpResponse.json({ user_id: userId, updated });
  }),

  http.patch<{ id: string }>(url("/notifications/:id"), async ({ params, request }) => {
    const body = await bodyOf(request);
    const index = notificationStore.items.findIndex((n) => n.notification_id === params.id);
    if (index === -1) {
      return HttpResponse.json({ detail: "Notification not found." }, { status: 404 });
    }
    const current = notificationStore.items[index];
    const readAt = body.is_read ? current.read_at || new Date().toISOString() : null;
    notificationStore.items[index] = { ...current, read_at: readAt, is_read: readAt !== null };
    return HttpResponse.json(notificationStore.items[index]);
  }),
];
