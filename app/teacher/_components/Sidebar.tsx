"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import "./sidebar.css";

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
}

export default function Sidebar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar__logo" aria-label="Mirai home">
        <Image
          src="/mirai-logo.png"
          alt="Mirai"
          width={140}
          height={48}
          className="sidebar__logo-img"
        />
      </Link>
      <nav className="sidebar__nav" aria-label="Main">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                active ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
