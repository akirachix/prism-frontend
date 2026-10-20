import { Suspense } from "react";
import { ResetPasswordScreen } from "@/features/auth/screens/ResetPasswordScreen";

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordScreen />
    </Suspense>
  );
}
