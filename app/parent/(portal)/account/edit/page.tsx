import EditProfileForm from "@/app/_components/account/EditProfileForm";

export const metadata = { title: "Edit profile · Mirai" };

export default function ParentEditProfilePage() {
  return <EditProfileForm portal="parent" />;
}
