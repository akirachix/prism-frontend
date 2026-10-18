"use client";

import type { ReactNode } from "react";
import { Link, NavLink } from "@/lib/router";

import OfflineBanner from "@/components/OfflineBanner";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <OfflineBanner />
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          mirAI
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <NavLink to="/notifications" className={styles.navLink}>
            Notifications
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
