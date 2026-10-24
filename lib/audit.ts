import { request } from "@/lib/api";
import { getSession } from "@/lib/session";

export type AuditAction =
  "VIEW" | "CREATE" | "UPDATE" | "SUBMIT" | "APPROVE" | "REJECT" | "EXPORT";

export function logAudit(
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
): void {
  const user = getSession()?.user;
  request("/audit-logs", {
    method: "POST",
    body: JSON.stringify({
      action,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      details: details ?? null,
      user_id: user?.user_id ?? null,
      school_id: user?.school_id ?? null,
      actor_role: user?.role ?? null,
    }),
  }).catch(() => {});
}

export interface AuditEntry {
  audit_id: string;
  user_id: string | null;
  actor_role: string | null;
  action:
    AuditAction | "LOGIN" | "LOGIN_FAILED" | "LOGOUT" | "DELETE" | "GENERATE";
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const auditApi = {
  forResource: (resourceId: string) =>
    request<AuditEntry[]>(
      `/audit-logs?resource_id=${encodeURIComponent(resourceId)}`,
    ).then((entries) =>
      [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    ),
};

const ACTION_WORDS: Record<string, string> = {
  CREATE: "Started",
  VIEW: "Opened",
  UPDATE: "Updated",
  SUBMIT: "Submitted",
  APPROVE: "Approved",
  REJECT: "Sent back",
  EXPORT: "Downloaded",
  DELETE: "Deleted",
  GENERATE: "Generated",
};

const ROLE_WORDS: Record<string, string> = {
  TEACHER: "teacher",
  PARENT: "parent",
  SCHOOL_ADMIN: "school administrator",
  SYSTEM_ADMIN: "Mirai",
};

const RESOURCE_WORDS: Record<string, string> = {
  case: "the case",
  iep: "the plan (IEP)",
  iep_evaluation: "the 6-week check",
  screening: "the screening",
  screening_report: "the screening report",
  student: "the student record",
  user: "the parent account",
};

export function describeAudit(entry: AuditEntry): string {
  const action = ACTION_WORDS[entry.action] ?? entry.action.toLowerCase();
  const role = entry.actor_role
    ? (ROLE_WORDS[entry.actor_role] ?? entry.actor_role.toLowerCase())
    : null;
  const what =
    RESOURCE_WORDS[entry.resource_type] ??
    entry.resource_type.replace(/_/g, " ");
  return `${action} ${what}${role ? ` by the ${role}` : ""}`;
}
