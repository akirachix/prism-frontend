"use client";

import { useState } from "react";

import { useUser } from "../SessionProvider";
import Button, { ButtonLink } from "../ui/Button";
import { Alert, PageHeader } from "../ui/bits";
import { errorMessage } from "@/lib/api";
import { authApi } from "@/lib/auth";
import "../portal.css";

/**
 * The API changes a password only inside the sign-in flow or through the
 * emailed reset link, so a signed-in person gets a reset link sent to
 * the email on their account.
 */
export default function ChangePassword({ portal }: { portal: "teacher" | "parent" }) {
  const user = useUser();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = `/${portal}/account`;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await authApi.forgotPassword(user.email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ui-page">
      <PageHeader title="Change password" back={{ href: back, label: "Back to account" }} />
      <div className="ui-body ui-body--narrow">
        <section className="ui-card ui-form">
          <p className="ui-text">
            For your safety we send a link to <strong>{user.email}</strong>. Open
            it on this device to choose a new password. The link works for a
            short time.
          </p>
          {sent && (
            <Alert tone="success">
              We sent the link. Check your inbox, and your spam folder if you do
              not see it.
            </Alert>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="ui-actions ui-actions--end">
            <ButtonLink href={back} variant="outline">
              Cancel
            </ButtonLink>
            <Button onClick={send} loading={busy}>
              {sent ? "Send again" : busy ? "Sending…" : "Email me a link"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
