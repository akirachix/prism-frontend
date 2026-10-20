"use client";

import type { ReactNode } from "react";
import { BookIcon, ChecklistIcon, HomeIcon, UserIcon } from "@/components/icons";
import { PortalFrame, type PortalNavItem } from "@/components/layout/PortalFrame";
import { AuthGuard } from "@/features/auth";

const NAV: PortalNavItem[] = [
  { href: "/teachers/home", match: ["/teachers/home"], desktop: "Home", mobile: "Home", Icon: HomeIcon },
  { href: "/teachers/student", match: ["/teachers/student"], desktop: "Students", mobile: "Students", Icon: BookIcon },
  { href: "/teachers/to-do", match: ["/teachers/to-do"], desktop: "To do", mobile: "To do", Icon: ChecklistIcon },
  { href: "/teachers/account", match: ["/teachers/account"], desktop: "Account", mobile: "Account", Icon: UserIcon },
];

/** Shell for every /teachers/* page: only signed-in TEACHER users get in. */
export function TeacherFrame({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["TEACHER"]}>
      <PortalFrame portalName="Teacher portal" accountLabel="Teacher account" nav={NAV}>
        {children}
      </PortalFrame>
    </AuthGuard>
  );
}
