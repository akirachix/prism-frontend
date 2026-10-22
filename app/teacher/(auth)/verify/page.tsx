import { Suspense } from "react";

import VerifyForm from "@/_components/auth/VerifyForm";
import TeacherAuth from "../TeacherAuth";

export const metadata = { title: "Verify your email · Mirai" };

export default function TeacherVerifyPage() {
  return (
    <TeacherAuth panel="shine" mobileHeader="plain">
      <Suspense fallback={null}>
        <VerifyForm portal="teacher" />
      </Suspense>
    </TeacherAuth>
  );
}
