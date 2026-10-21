import ChangePassword from "@/app/_components/account/ChangePassword";

export const metadata = { title: "Change password · Mirai" };

export default function ParentChangePasswordPage() {
  return <ChangePassword portal="parent" />;
}
