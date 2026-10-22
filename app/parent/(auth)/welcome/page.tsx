import { Suspense } from "react";

import LoginForm from "@/app/_components/auth/LoginForm";
import ResendHelp from "./ResendHelp";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Welcome · Mirai for parents" };

export default function WelcomePage() {
  return (
    <ParentAuth signup>
      <div className="auth-step">
        <div>
          <h1 className="auth-title">Welcome</h1>
          <p className="auth-lead">
            Enter the temporary password sent to your email.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm
            portal="parent"
            mode="temporary"
            submitLabel="Continue"
            framed={false}
          />
        </Suspense>
        <ResendHelp />
      </div>
    </ParentAuth>
  );
}
