"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { UserIcon } from "../icons";
import { Squiggle } from "../ui/Squiggle";

export interface PortalNavItem {
  href: string;
  /** The item is highlighted when the path starts with one of these. */
  match: string[];
  desktop: string;
  mobile: string;
  Icon: ComponentType<{ size?: number }>;
}

interface Props {
  /** "Mirai parent portal" under the sidebar, "Parent portal" in the top bar ... */
  portalName: string;
  accountLabel: string;
  nav: PortalNavItem[];
  /** While set, every nav item except this href is disabled (e.g. mid-evaluation). */
  lockedExcept?: string | null;
  children: ReactNode;
}

/**
 * The signed-in shell: sidebar on desktop, top bar, tab bar on mobile.
 * It has no knowledge of auth; the feature's frame wraps it in <AuthGuard>.
 */
export function PortalFrame({
  portalName,
  accountLabel,
  nav,
  lockedExcept,
  children,
}: Props) {
  const pathname = usePathname();
  const activeIndex = nav.findIndex((item) =>
    item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)),
  );
  const isLocked = (href: string) =>
    Boolean(lockedExcept) && href !== lockedExcept;

  return (
    <div className="app">
      <aside className="sidebar">
        <Image
          src="/images/mirai-logo.png"
          alt="Mirai"
          width={113}
          height={53}
          priority
          className="sidebar__logo"
        />
        <nav className="sidebar__nav" aria-label="Main">
          {nav.map((item, i) => {
            const cls = `sidebar__item ${i === activeIndex ? "is-active" : ""}`;
            const body = (
              <>
                <item.Icon size={17} />
                <span>{item.desktop}</span>
              </>
            );
            return isLocked(item.href) ? (
              <span
                key={item.href}
                className={cls}
                aria-disabled="true"
                style={{ cursor: "default" }}
              >
                {body}
              </span>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>
                {body}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar__foot">
          <Squiggle color="#f58220" />
          <p>Mirai {portalName.toLowerCase()}</p>
        </div>
      </aside>

      <div className="app__main">
        <div className="topbar">
          <span className="topbar__title">{portalName}</span>
          <span className="topbar__account">
            <UserIcon size={18} /> {accountLabel}
          </span>
        </div>
        {children}
      </div>

      <nav className="tabbar" aria-label="Main">
        {nav.map((item, i) => {
          const cls = `tabbar__item ${i === activeIndex ? "is-active" : ""}`;
          const body = (
            <>
              <item.Icon size={19} />
              <span>{item.mobile}</span>
            </>
          );
          return isLocked(item.href) ? (
            <span
              key={item.href}
              className={cls}
              aria-disabled="true"
              style={{ cursor: "default" }}
            >
              {body}
            </span>
          ) : (
            <Link key={item.href} href={item.href} className={cls}>
              {body}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
