import { Suspense } from "react";

import NewPasswordForm from "@/_components/auth/NewPasswordForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Create a new password · Mirai for parents" };

export default function ParentNewPasswordPage() {
  return (
    <ParentAuth signup>
      <h1 className="auth-title">Create a new password</h1>
      <p className="auth-lead auth-lead--muted">
        Your temporary password has been verified. Create a new password.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm
          portal="parent"
          mode="change"
          askName
          submitLabel="Save password"
        />
      </Suspense>
    </ParentAuth>
  );
}
