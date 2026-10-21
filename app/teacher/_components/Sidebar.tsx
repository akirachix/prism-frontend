"use client";

import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  House,
  ListChecks,
  School,
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
  reports: BarChart3,
  school: School,
  evaluation: ClipboardCheck,
};

export type IconName = keyof typeof ICONS;

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  also?: string;
  icon?: IconName;
}

export default function Sidebar({
  links,
  variant,
}: {
  links: NavLink[];
  variant?: "parent";
}) {
  const pathname = usePathname();

  return (
    <aside
      className={variant === "parent" ? "sidebar sidebar--parent" : "sidebar"}
    >
      <Link href="/" className="sidebar__logo" aria-label="Mirai home">
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
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href) ||
              (link.also ? pathname.startsWith(link.also) : false);
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
