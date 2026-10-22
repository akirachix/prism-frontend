import type { ReactNode } from "react";
import { Suspense } from "react";

import RequireRole from "@/app/_components/RequireRole";
import Sidebar, { type NavLink } from "@/app/teacher/_components/Sidebar";
import ChildProvider from "../_components/ChildProvider";
import ParentTopbar from "../_components/ParentTopbar";
import "../_components/parent-shell.css";

const LINKS: NavLink[] = [
  { href: "/parent", label: "Home", icon: "home", exact: true },
  { href: "/parent/reports", label: "Reports", icon: "reports" },
  { href: "/parent/school", label: "School", icon: "school" },
  { href: "/parent/evaluation", label: "Evaluation", icon: "evaluation" },
  { href: "/parent/account", label: "Profile", icon: "account" },
];

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RequireRole role="PARENT" loginPath="/parent/login">
        <ChildProvider>
          <div className="parent-shell">
            <Sidebar links={LINKS} variant="parent" />
            <div className="parent-shell__main">
              <ParentTopbar />
              {children}
            </div>
          </div>
        </ChildProvider>
      </RequireRole>
    </Suspense>
  );
}
