import type { ReactNode } from "react";

import AuthLayout from "@/_components/AuthLayout";

export default function ParentAuth({
  signup,
  children,
}: {
  signup?: boolean;
  children: ReactNode;
}) {
  return (
    <AuthLayout
      portal="parent"
      mobileHeader="bar"
      mobileTitle={
        signup
          ? "Sign-up into the parent portal"
          : "Sign-in into the parent portal"
      }
      panelTitle={
        <>
          Supporting your child, together<span className="auth-dot">.</span>
        </>
      }
      panelText="Welcome to Mirai, your connection to screening, reports and your child’s learning journey."
    >
      {children}
    </AuthLayout>
  );
}
