"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Alert, Loading } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import {
  invitationStepHref,
  parentInvitationApi,
} from "@/lib/parent-invitation";
import InviteAcceptFields from "./InviteAcceptFields";

export default function ParentInviteForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const invitation = useLoad(
    () => (token ? parentInvitationApi.details(token) : Promise.resolve(null)),
    [token],
  );

  if (!token) {
    return (
      <Alert>
        This link is missing its code. Open the link from your email again, or
        ask your child&apos;s teacher to resend the invitation.
      </Alert>
    );
  }

  if (!email) {
    return (
      <Alert tone="info">
        First confirm the email address the school invited.{" "}
        <Link href={invitationStepHref("welcome", token)}>
          Confirm my email
        </Link>
      </Alert>
    );
  }

  if (invitation.loading && !invitation.data) return <Loading />;

  if (invitation.error || !invitation.data) {
    return (
      <Alert>
        {invitation.error ?? "This invitation could not be found."} Ask your
        child&apos;s teacher to resend the invitation.
      </Alert>
    );
  }

  return (
    <InviteAcceptFields
      token={token}
      email={email}
      invitation={invitation.data}
    />
  );
}
