import { Suspense } from "react";

import VerifyForm from "@/app/_components/auth/VerifyForm";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Verify your email · Mirai for parents" };

export default function ParentVerifyPage() {
  return (
    <ParentAuth>
      <Suspense fallback={null}>
        <VerifyForm portal="parent" />
      </Suspense>
    </ParentAuth>
  );
}
