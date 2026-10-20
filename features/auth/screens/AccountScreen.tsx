"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loading } from "@/components/ui/StateMessage";
import { initials } from "@/lib/format";
import { useSession } from "../session";

const ROLE_LABEL: Record<string, string> = {
  PARENT: "Parent",
  TEACHER: "Teacher",
  SCHOOL_ADMIN: "School admin",
  SYSTEM_ADMIN: "System admin",
};

const card = {
  background: "#f3efe7",
  border: "2px solid #0a2d5d",
  borderRadius: 18,
} as const;

const linkRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 16px",
  fontSize: 20,
  color: "#0a2d5d",
  fontWeight: 600,
} as const;

/**
 * Signed-in person's own account page (parent "Profile", teacher "Account").
 * Everything shown comes from the real user (GET /auth/me, kept fresh by AuthGuard).
 * The school name from the design is not shown: the backend has no /schools
 * endpoint yet (the user only has a school_id).
 */
export function AccountScreen({ title }: { title: string }) {
  const { user } = useSession();

  return (
    <>
      <PageHeader title={title} />
      <div className="page-body" style={{ maxWidth: 500, margin: "0 auto", padding: "0 18px 48px" }}>
        {!user ? (
          <Loading />
        ) : (
          <>
            <div
              style={{
                background: "#062d5a",
                borderRadius: 18,
                color: "#fff",
                height: 72,
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                marginTop: 12,
                marginBottom: 16,
                border: "2px solid #062d5a",
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em" }}>Account</span>
            </div>

            <div style={{ ...card, padding: "18px 16px", display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#d61f3d",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {initials(user.name)}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0a2d5d" }}>{user.name}</div>
                <div style={{ fontSize: 15, color: "#0a2d5d" }}>{ROLE_LABEL[user.role] ?? user.role}</div>
              </div>
            </div>

            <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: "#0a2d5d" }}>Profile</div>

            <div style={{ ...card, padding: "18px 18px 10px" }}>
              <dl style={{ display: "grid", gap: 18, margin: 0 }}>
                {[
                  ["Email", user.email],
                  ["Phone", user.phone],
                  ["Name", user.name],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt style={{ fontSize: 14, color: "#0a2d5d", marginBottom: 4 }}>{label}</dt>
                    <dd style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0a2d5d", wordBreak: "break-word" }}>
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div style={{ marginTop: 22, marginBottom: 12, fontSize: 18, fontWeight: 700, color: "#0a2d5d" }}>
              Security
            </div>

            <div style={{ ...card, overflow: "hidden" }}>
              <Link href="/change-password" style={{ ...linkRow, borderBottom: "1px solid rgba(10,45,93,0.5)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <span aria-hidden="true">🔒</span>
                  <span>Change password</span>
                </span>
                <ChevronRightIcon size={20} />
              </Link>
              <Link href="/edit-profile" style={linkRow}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <span aria-hidden="true">✎</span>
                  <span>Edit profile</span>
                </span>
                <ChevronRightIcon size={20} />
              </Link>
            </div>

            <Link
              href="/logout"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginTop: 24,
                border: "2px solid #d51d38",
                color: "#d51d38",
                borderRadius: 999,
                height: 52,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Sign Out
            </Link>
          </>
        )}
      </div>
    </>
  );
}
