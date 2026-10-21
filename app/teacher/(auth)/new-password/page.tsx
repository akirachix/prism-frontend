import { Suspense } from "react";

import NewPasswordForm from "@/app/_components/auth/NewPasswordForm";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Create a new password · Mirai" };

export default function TeacherNewPasswordPage() {
  return (
    <TeacherAuth panel="shine" mobileHeader="plain">
      <h1 className="auth-title">Create a new password</h1>
      <p className="auth-lead auth-lead--muted">
        Your temporary password has been verified. Create a new password.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm portal="teacher" mode="change" />
      </Suspense>
    </TeacherAuth>
  );
}
