import EditProfileForm from "@/app/_components/account/EditProfileForm";

export const metadata = { title: "Edit profile · Mirai" };

export default function TeacherEditProfilePage() {
  return <EditProfileForm portal="teacher" />;
}
