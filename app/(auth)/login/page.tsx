import { Suspense } from "react";
import { GuestOnly } from "@/features/auth";
import { PortalChooserScreen } from "@/features/auth/screens/PortalChooserScreen";

export default function Page() {
  return (
    <Suspense>
      <GuestOnly>
        <PortalChooserScreen />
      </GuestOnly>
    </Suspense>
  );
}
