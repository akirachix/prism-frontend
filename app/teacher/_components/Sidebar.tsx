"use client";

import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  House,
  ListChecks,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import "./sidebar.css";

const LOGO_WIDTH = 560;
const LOGO_HEIGHT = 192;

const ICONS = {
  home: House,
  students: GraduationCap,
  cases: ClipboardList,
  todo: ListChecks,
  account: User,
  reports: FileText,
  school: BookOpen,
  evaluation: ClipboardCheck,
};

export type IconName = keyof typeof ICONS;

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  icon?: IconName;
  /** Another path prefix that belongs to this section (plain string, so a
   * server layout can pass it). */
  also?: string;
}

export default function Sidebar({
  links,
  variant = "teacher",
}: {
  links: NavLink[];
  /** Parent nav highlights the active tab in red on mobile. */
  variant?: "teacher" | "parent";
}) {
  const pathname = usePathname();
  const home = links[0]?.href ?? "/";

  return (
    <aside className={variant === "parent" ? "sidebar sidebar--parent" : "sidebar"}>
      <Link href={home} className="sidebar__logo" aria-label="Mirai home">
        <Image
          src="/mirai-logo.png"
          alt="Mirai"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          loading="eager"
          className="sidebar__logo-img"
        />
      </Link>
      <nav className="sidebar__nav" aria-label="Main">
        {links.map((link) => {
          const active =
            (link.exact ? pathname === link.href : pathname.startsWith(link.href)) ||
            Boolean(link.also && pathname.startsWith(link.also));
          const Icon = link.icon ? ICONS[link.icon] : null;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                active ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
            >
              {Icon && (
                <Icon className="sidebar__icon" size={24} aria-hidden="true" />
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
