import SignOutConfirm from "@/app/_components/account/SignOutConfirm";

export const metadata = { title: "Log out · Mirai" };

export default function ParentSignOutPage() {
  return <SignOutConfirm portal="parent" />;
}
