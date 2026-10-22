import AccountView from "@/app/_components/account/AccountView";

export const metadata = { title: "Profile · Mirai" };

export default function ParentAccountPage() {
  return <AccountView portal="parent" />;
}
