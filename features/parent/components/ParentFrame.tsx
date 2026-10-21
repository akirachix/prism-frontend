"use client";

import type { ReactNode } from "react";
import {
  BookIcon,
  ChecklistIcon,
  DocIcon,
  HomeIcon,
  UserIcon,
} from "@/components/icons";
import {
  PortalFrame,
  type PortalNavItem,
} from "@/components/layout/PortalFrame";
import { AuthGuard } from "@/features/auth";
import { useNavLocked } from "../nav-lock";

const NAV: PortalNavItem[] = [
  {
    href: "/parent/dashboard",
    match: ["/parent/dashboard", "/parent/screening"],
    desktop: "Home",
    mobile: "Home",
    Icon: HomeIcon,
  },
  {
    href: "/parent/reports",
    match: ["/parent/reports"],
    desktop: "Reports",
    mobile: "Reports",
    Icon: DocIcon,
  },
  {
    href: "/parent/school",
    match: ["/parent/school"],
    desktop: "School",
    mobile: "School",
    Icon: BookIcon,
  },
  {
    href: "/parent/evaluation",
    match: ["/parent/evaluation"],
    desktop: "Evaluation",
    mobile: "Evaluation",
    Icon: ChecklistIcon,
  },
  {
    href: "/parent/profile",
    match: ["/parent/profile"],
    desktop: "More",
    mobile: "Profile",
    Icon: UserIcon,
  },
];

export function ParentFrame({ children }: { children: ReactNode }) {
  const locked = useNavLocked();
  return (
    <AuthGuard allowedRoles={["PARENT"]}>
      <PortalFrame
        portalName="Parent portal"
        accountLabel="Parent account"
        nav={NAV}
        lockedExcept={locked ? "/parent/evaluation" : null}
      >
        {children}
      </PortalFrame>
    </AuthGuard>
  );
}
