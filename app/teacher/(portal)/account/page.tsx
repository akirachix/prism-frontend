import AccountView from "@/app/_components/account/AccountView";

export const metadata = { title: "Account · Mirai" };

export default function TeacherAccountPage() {
  return <AccountView portal="teacher" />;
}
