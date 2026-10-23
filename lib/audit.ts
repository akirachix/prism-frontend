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
