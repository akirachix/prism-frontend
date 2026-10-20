import { AuthGuard } from "@/features/auth";
import { ChangePasswordScreen } from "@/features/auth/screens/ChangePasswordScreen";

export default function Page() {
  return (
    <AuthGuard>
      <ChangePasswordScreen />
    </AuthGuard>
  );
}
