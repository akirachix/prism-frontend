import { Suspense } from "react";

import NewPasswordForm from "@/_components/auth/NewPasswordForm";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Set a new password · Mirai" };

export default function TeacherResetPage() {
  return (
    <TeacherAuth panel="shine" mobileHeader="plain">
      <h1 className="auth-title">Set a new password</h1>
      <p className="auth-lead auth-lead--muted">
        Choose a password you have not used before.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm portal="teacher" mode="reset" />
      </Suspense>
    </TeacherAuth>
  );
}
