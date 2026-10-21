import { TeacherFrame } from "@/features/teacher";

export default function TeachersLayout({ children }: LayoutProps<"/teachers">) {
  return <TeacherFrame>{children}</TeacherFrame>;
}
