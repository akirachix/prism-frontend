import type { ReactNode } from "react";
import { Suspense } from "react";

import Sidebar, { type NavLink } from "./_components/Sidebar";
import "./teacher-layout.css";

const LINKS: NavLink[] = [
  { href: "/teacher", label: "Home", exact: true },
  { href: "/teacher/students", label: "Students" },
  { href: "/teacher/cases", label: "Cases" },
  { href: "/teacher/account", label: "Account" },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="teacher-shell">
      <Suspense fallback={null}>
        <Sidebar links={LINKS} />
      </Suspense>
      <div className="teacher-shell__main">{children}</div>
    </div>
  );
}
