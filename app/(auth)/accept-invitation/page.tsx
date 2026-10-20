import { Suspense } from "react";
import { AcceptInvitationScreen } from "@/features/auth/screens/AcceptInvitationScreen";

export default function Page() {
  return (
    <Suspense>
      <AcceptInvitationScreen />
    </Suspense>
  );
}
