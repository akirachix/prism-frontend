"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Link, Navigate, NavLink, useLocation } from "@/lib/router";

import { SESSION_EXPIRED_EVENT } from "@/services/apiClient";
import { getSession } from "@/services/session";
import styles from "./ParentLayout.module.css";

type IconProps = { className?: string };

const NAV: {
  to: string;
  label: string;
  mobileLabel?: string;
  icon: (p: IconProps) => ReactElement;
  end?: boolean;
}[] = [
  { to: "/parent", label: "Home", icon: HomeIcon, end: true },
  { to: "/parent/reports", label: "Reports", icon: ReportIcon },
  { to: "/parent/school", label: "School", icon: BookIcon },
  { to: "/parent/evaluation", label: "Evaluation", icon: ClipboardIcon },

  { to: "/parent/more", label: "More", mobileLabel: "Profile", icon: UserIcon },
];

export const PARENT_AUTH_PAGES = [
  "/parent/invite",
  "/parent/consent",
  "/parent/sign-in",
  "/parent/change-password",
  "/parent/verify-email",
];

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const session = getSession();
  const signedIn = session?.token && session?.user?.role === "parent";

  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const onExpired = () => setExpired(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (PARENT_AUTH_PAGES.includes(pathname.replace(/\/$/, ""))) return <>{children}</>;

  if (!signedIn) {
    return (
      <Navigate
        to="/parent/sign-in"
        replace
        state={expired ? { notice: "You were signed out. Please sign in again." } : undefined}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <img src="/images/teacher-home/logo-white.svg" alt="" className={styles.logoMark} />
          <span className={styles.logoText}>mirai</span>
        </div>
        <nav className={styles.nav} aria-label="Main">
          {NAV.map(({ to, label, mobileLabel, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              <Icon className={styles.icon} />
              <span className={mobileLabel ? styles.desktopLabel : undefined}>{label}</span>
              {mobileLabel && <span className={styles.mobileLabel}>{mobileLabel}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer} aria-hidden="true">
          <svg viewBox="0 0 76 24" className={styles.wave} fill="none">
            <path
              d="M2 14c6 6 12 8 18 2s10-12 18-8 10 14 18 12 12-8 18-6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <p className={styles.footerText}>Mirai parent portal</p>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topBar}>
          <span className={styles.portal}>Parent portal</span>
          <Link to="/parent/more" className={styles.account}>
            <UserIcon className={styles.accountIcon} />
            Parent account
          </Link>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

const svg = (className: string | undefined, children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

function HomeIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <path d="M4 10.5 12 4l8 6.5V20H4z" />
      <path d="M10 20v-5h4v5" />
    </>,
  );
}
function ReportIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 15.5h5M10 9h2" />
    </>,
  );
}
function BookIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <path d="M3 5.5c3-1.3 6-1.3 9 .5v14c-3-1.8-6-1.8-9-.5z" />
      <path d="M21 5.5c-3-1.3-6-1.3-9 .5v14c3-1.8 6-1.8 9-.5z" />
    </>,
  );
}
function ClipboardIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <rect x="6" y="4.5" width="12" height="16.5" rx="2" />
      <path d="M9.5 3h5v3h-5zM9.2 13.2l2 2 3.8-4" />
    </>,
  );
}
export function UserIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4.5 21c0-4.2 3.4-7.2 7.5-7.2s7.5 3 7.5 7.2" />
    </>,
  );
}
