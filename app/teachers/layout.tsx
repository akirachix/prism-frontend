import { TeacherFrame } from "@/features/teacher";

/** Layout for all /teachers/* routes: navigation shell + TEACHER-only guard. */
export default function TeachersLayout({ children }: LayoutProps<"/teachers">) {
  return <TeacherFrame>{children}</TeacherFrame>;
}
