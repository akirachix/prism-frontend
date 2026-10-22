import { Suspense } from "react";

import NewPasswordForm from "@/app/_components/auth/NewPasswordForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Set a new password · Mirai for parents" };

export default function ParentResetPage() {
  return (
    <ParentAuth>
      <h1 className="auth-title">Set a new password</h1>
      <p className="auth-lead auth-lead--muted">
        Choose a password you have not used before.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm portal="parent" mode="reset" />
      </Suspense>
    </ParentAuth>
  );
}
