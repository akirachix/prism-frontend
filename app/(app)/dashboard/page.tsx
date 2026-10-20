import { AuthGuard } from "@/features/auth";
import { NoPortalScreen } from "@/features/auth/screens/NoPortalScreen";

export default function Page() {
  return (
    <AuthGuard>
      <NoPortalScreen />
    </AuthGuard>
  );
}
