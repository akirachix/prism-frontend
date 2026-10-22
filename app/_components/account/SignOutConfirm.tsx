"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "../SessionProvider";
import Button, { ButtonLink } from "../ui/Button";
import { IconBadge, PageHeader } from "../ui/bits";
import "../portal.css";

export default function SignOutConfirm({ portal }: { portal: "teacher" | "parent" }) {
  const { signOut } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    await signOut();
    router.replace(`/${portal}/login?notice=signed-out`);
  }

  return (
    <main className="ui-page">
      <PageHeader title="Sign out" back={{ href: `/${portal}/account`, label: "Back to account" }} />
      <div className="ui-body ui-body--narrow ui-body--center">
        <section className="ui-card portal-result" style={{ background: "#fff" }}>
          <IconBadge>
            <LogOut size={34} strokeWidth={1.6} />
          </IconBadge>
          <h2 className="portal-result__title">Sign out of Mirai?</h2>
          <p>Are you sure you want to sign out? You can sign in again to open your account.</p>
          <div className="ui-actions">
            <ButtonLink href={`/${portal}/account`} variant="outline">
              Cancel
            </ButtonLink>
            <Button onClick={confirm} loading={busy}>
              {busy ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
