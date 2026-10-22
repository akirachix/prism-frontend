"use client";

import { Info } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { ButtonLink } from "@/app/_components/ui/Button";
import { MailBadge } from "@/app/_components/ui/bits";

export default function InviteCard() {
  const params = useSearchParams();
  const token = params.get("token");
  const school = params.get("school");
  const href = token
    ? `/parent/set-password?token=${encodeURIComponent(token)}`
    : "/parent/welcome";

  return (
    <div className="auth-center">
      <MailBadge />
      <h1 className="auth-title">You&apos;re invited!</h1>
      <p className="auth-lead">
        {school ?? "Your child’s school"} has invited you to join Mirai. Get
        started to support your child&apos;s learning journey.
      </p>
      <p className="auth-invite-info">
        <Info size={20} aria-hidden="true" />
        This invitation is just for your parent account.
      </p>
      <ButtonLink href={href} block>
        View invitation
      </ButtonLink>
    </div>
  );
}
