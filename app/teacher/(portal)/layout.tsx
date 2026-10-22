import type { ReactNode } from "react";
import { Suspense } from "react";

import RequireRole from "@/app/_components/RequireRole";
import Sidebar, { type NavLink } from "../_components/Sidebar";
import "./teacher-layout.css";

const LINKS: NavLink[] = [
  { href: "/teacher", label: "Home", icon: "home", exact: true },
  // A case's own pages (screening, plan, check…) are reached from a student.
  { href: "/teacher/students", label: "Students", icon: "students", also: "/teacher/cases/" },
  { href: "/teacher/cases", label: "Cases", icon: "cases", exact: true },
  { href: "/teacher/todo", label: "To do", icon: "todo" },
  { href: "/teacher/account", label: "Account", icon: "account" },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RequireRole role="TEACHER" loginPath="/teacher/login">
        <div className="teacher-shell">
          <Sidebar links={LINKS} />
          <div className="teacher-shell__main">{children}</div>
        </div>
      </RequireRole>
    </Suspense>
  );
}
