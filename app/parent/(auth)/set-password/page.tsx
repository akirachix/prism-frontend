import { Suspense } from "react";

import NewPasswordForm from "@/app/_components/auth/NewPasswordForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Create a password · Mirai for parents" };

export default function SetPasswordPage() {
  return (
    <ParentAuth signup>
      <h1 className="auth-title">Create a new password</h1>
      <p className="auth-lead auth-lead--muted">
        Your invitation has been verified. Add your name and create a password.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm
          portal="parent"
          mode="invite"
          askName
          submitLabel="Update profile"
        />
      </Suspense>
    </ParentAuth>
  );
}
