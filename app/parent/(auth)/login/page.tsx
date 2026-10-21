import Link from "next/link";
import { Suspense } from "react";

import LoginForm from "@/app/_components/auth/LoginForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Sign in · Mirai for parents" };

export default function ParentLoginPage() {
  return (
    <ParentAuth>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-lead">Sign in to your parent account.</p>
      <Suspense fallback={null}>
        <LoginForm portal="parent" showRemember framed={false} />
      </Suspense>
      <p className="auth-switch">
        First time here?{" "}
        <Link href="/parent/welcome">Use your temporary password</Link>
      </p>
    </ParentAuth>
  );
}
