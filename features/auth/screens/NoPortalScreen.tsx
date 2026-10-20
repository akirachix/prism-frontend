"use client";

import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { useSession } from "../session";

/**
 * Landing page for roles that have no Mirai portal (SCHOOL_ADMIN, SYSTEM_ADMIN).
 * The admin console is built by another feature owner; until then this keeps
 * those accounts from hitting a dead end.
 */
export function NoPortalScreen() {
  const { user } = useSession();
  return (
    <AuthShell subtitle="Signed in" role="any">
      <h1 className="heading">Hello{user ? `, ${user.firstName || user.name}` : ""}</h1>
      <p className="lead">
        The parent and teacher portals are for families and teachers. The admin console is not part of
        this app yet.
      </p>
      <div className="form-actions" style={{ marginTop: 28 }}>
        <Button href="/logout" variant="outline">
          Sign out
        </Button>
      </div>
    </AuthShell>
  );
}
