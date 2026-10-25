"use client";

import { Info } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { ButtonLink } from "@/_components/ui/Button";
import { Alert, Loading, MailBadge } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { formatLongDay } from "@/lib/format";
import {
  childrenLabel,
  invitationStepHref,
  parentInvitationApi,
} from "@/lib/parent-invitation";

export default function InviteCard() {
  const params = useSearchParams();
  const token = params.get("token");
  const invitation = useLoad(
    () => (token ? parentInvitationApi.details(token) : Promise.resolve(null)),
    [token],
  );

  if (!token) {
    return (
      <div className="auth-center">
        <MailBadge />
        <h1 className="auth-title">You&apos;re invited!</h1>
        <Alert>
          This link is missing its code. Open the link from your email again, or
          ask your child&apos;s teacher to resend the invitation.
        </Alert>
      </div>
    );
  }

  if (invitation.loading && !invitation.data) return <Loading />;

  if (invitation.error || !invitation.data) {
    return (
      <div className="auth-center">
        <MailBadge />
        <h1 className="auth-title">You&apos;re invited!</h1>
        <Alert>
          {invitation.error ?? "This invitation could not be found."} Ask your
          child&apos;s teacher to resend the invitation.
        </Alert>
      </div>
    );
  }

  const { school_name, parent_first_name, children, expires_at } =
    invitation.data;

  return (
    <div className="auth-center">
      <MailBadge />
      <h1 className="auth-title">You&apos;re invited!</h1>
      <p className="auth-lead">
        Hello {parent_first_name}, {school_name} has invited you to join Mirai
        to support {childrenLabel(children)}&apos;s learning journey.
      </p>
      <p className="auth-invite-info">
        <Info size={20} aria-hidden="true" />
        This invitation is just for your parent account. It works until{" "}
        {formatLongDay(expires_at)}.
      </p>
      <ButtonLink href={invitationStepHref("welcome", token)} block>
        View invitation
      </ButtonLink>
    </div>
  );
}
