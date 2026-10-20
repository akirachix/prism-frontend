import { AuthGuard } from "@/features/auth";
import { LogoutScreen } from "@/features/auth/screens/LogoutScreen";

export default function Page() {
  return (
    <AuthGuard>
      <LogoutScreen />
    </AuthGuard>
  );
}
