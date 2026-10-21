import EditProfileForm from "@/_components/account/EditProfileForm";

export const metadata = { title: "Edit profile · Mirai" };

export default function ParentEditProfilePage() {
  return <EditProfileForm portal="parent" />;
}
