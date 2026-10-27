"use client";

import { useSearchParams } from "next/navigation";

import LoginForm from "@/_components/auth/LoginForm";
import InviteEmailForm from "./InviteEmailForm";
import ResendHelp from "./ResendHelp";

export default function WelcomeStep() {
  const token = useSearchParams().get("token");

  if (token) {
    return (
      <div className="auth-step">
        <div>
          <h1 className="auth-title">Welcome</h1>
          <p className="auth-lead">
            Enter the email address your child&apos;s school sent the invitation
            to.
          </p>
        </div>
        <InviteEmailForm token={token} />
        <ResendHelp />
      </div>
    );
  }

  return (
    <div className="auth-step auth-welcome">
      <div>
        <h1 className="auth-title">Welcome</h1>
        <p className="auth-lead">
          Enter the temporary password sent to your email.
        </p>
      </div>
      <LoginForm
        portal="parent"
        mode="temporary"
        submitLabel="Continue"
        framed={false}
      />
      <ResendHelp />
    </div>
  );
}
