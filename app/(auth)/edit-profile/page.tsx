import { AuthGuard } from "@/features/auth";
import { EditProfileScreen } from "@/features/auth/screens/EditProfileScreen";

export default function Page() {
  return (
    <AuthGuard>
      <EditProfileScreen />
    </AuthGuard>
  );
}
