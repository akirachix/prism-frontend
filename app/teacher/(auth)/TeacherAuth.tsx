import type { ReactNode } from "react";

import AuthLayout from "@/_components/AuthLayout";

/** The two teacher panels from the designs. */
export default function TeacherAuth({
  panel,
  mobileHeader,
  children,
}: {
  panel: "hello" | "shine";
  mobileHeader: "hero" | "plain";
  children: ReactNode;
}) {
  return (
    <AuthLayout
      portal="teacher"
      mobileHeader={mobileHeader}
      mobileTitle={mobileHeader === "hero" ? "Hello, Teacher!" : undefined}
      mobileText={
        mobileHeader === "hero"
          ? "Sign in with the account your school administrator made for you."
          : undefined
      }
      panelTitle={
        panel === "hello" ? (
          <>
            Hello,
            <br />
            Teacher!
          </>
        ) : (
          "Help your student shine!"
        )
      }
      panelText={
        panel === "hello"
          ? "mirai helps you notice early signs that a child may need Individualized Education Plan (IEP) due to learning differences."
          : "Welcome to Mirai, your connection to screening, your student’s learning journey."
      }
    >
      {children}
    </AuthLayout>
  );
}
