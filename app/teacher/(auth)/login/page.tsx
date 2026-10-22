import { Suspense } from "react";

import LoginForm from "@/app/_components/auth/LoginForm";
import { Disclaimer, Note } from "@/app/_components/ui/bits";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Sign in · Mirai for teachers" };

export default function TeacherLoginPage() {
  return (
    <TeacherAuth panel="hello" mobileHeader="hero">
      <h1 className="auth-title auth-title--desktop">Sign In</h1>
      <Suspense fallback={null}>
        <LoginForm portal="teacher" />
      </Suspense>
      <div className="auth-note-wrap">
        <Note>
          <strong>No account yet?</strong>&nbsp; Ask your school administrator to
          create one for you
        </Note>
      </div>
      <div className="auth-mobile-only auth-disclaimer">
        <Disclaimer>Mirai is a screening tool. It never gives a diagnosis</Disclaimer>
      </div>
    </TeacherAuth>
  );
}
