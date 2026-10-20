import { Suspense } from "react";
import { GuestOnly } from "@/features/auth";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";

export default function Page() {
  return (
    <Suspense>
      <GuestOnly>
        <LoginScreen portal="teacher" />
      </GuestOnly>
    </Suspense>
  );
}
