"use client";

import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";

const NOTICES: Record<string, { className: string; text: string }> = {
  expired: { className: "form-info", text: "Your session expired. Please sign in again." },
  reset: { className: "form-info", text: "Password updated. Sign in with your new password." },
};

/** /login - choose the portal (parent or teacher). */
export function PortalChooserScreen() {
  const notice = NOTICES[useSearchParams().get("reason") ?? ""];

  return (
    <AuthShell subtitle="Sign in to the portal" role="parent">
      <h1 className="heading">Sign in</h1>
      <p className="lead">Choose the portal you want to access.</p>

      {notice && (
        <p className={notice.className} role="status" style={{ marginTop: 16 }}>
          {notice.text}
        </p>
      )}

      <div style={{ marginTop: 28, display: "grid", gap: 16 }}>
        <Button href="/login/parent">Parent portal</Button>
        <Button href="/login/teacher" variant="outline">
          Teacher portal
        </Button>
      </div>
    </AuthShell>
  );
}
