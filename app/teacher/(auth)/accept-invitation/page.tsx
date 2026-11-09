import { Suspense } from "react";

import NewPasswordForm from "@/_components/auth/NewPasswordForm";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Activate your account · Mirai" };

export default function TeacherAcceptInvitationPage() {
  return (
    <TeacherAuth panel="shine" mobileHeader="plain">
      <h1 className="auth-title">Welcome to Mirai</h1>
      <p className="auth-lead auth-lead--muted">
        Choose a password to activate your account.
      </p>
      <Suspense fallback={null}>
        <NewPasswordForm
          portal="teacher"
          mode="invite"
          submitLabel="Set password"
        />
      </Suspense>
    </TeacherAuth>
  );
}
