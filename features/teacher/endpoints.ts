/**
 * Teacher-portal endpoint map  -  THE place to change a URL.
 *
 *   LIVE     exists in the backend today (OpenAPI spec).
 *   PENDING  not built yet: the matching api.ts function returns
 *            pendingEndpoint(...) in real mode.
 */
export const teacherEndpoints = {
  // ── LIVE ──────────────────────────────────────────────────────────────
  /** GET ?initiated_by=&open_only=&limit= -> CaseRead[] */
  cases: "/cases",
  /** GET ?limit= -> IepRead[] (filtered to the teacher's cases in the browser) */
  ieps: "/ieps",
  /** GET ?user_id=&limit= -> NotificationRead[] */
  notifications: "/notifications",

  // ── PENDING ───────────────────────────────────────────────────────────
  /** Student names, admission numbers, class: needs a /students endpoint. */
  students: "/students",
} as const;
