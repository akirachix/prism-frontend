import type { ReactNode } from "react";

import TeacherLayout from "@/layouts/TeacherLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <TeacherLayout>{children}</TeacherLayout>;
}

export const instant = false;
