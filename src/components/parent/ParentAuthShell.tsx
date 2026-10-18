"use client";

import { Link } from "@/lib/router";
import type { ReactNode } from "react";

import styles from "./ParentAuthShell.module.css";

type IconProps = { className?: string };

export default function ParentAuthShell({
  mobileTitle,
  plain = false,
  children,
}: {
  mobileTitle: ReactNode;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.page} ${plain ? styles.plain : ""}`}>
      <aside className={styles.panel}>
        <Decorations />
        <div className={styles.logo}>
          <img src="/images/teacher-home/logo-white.svg" alt="" className={styles.logoMark} />
          <span className={styles.logoText}>mirai</span>
        </div>

        <p className={styles.mobileTitle}>{mobileTitle}</p>

        <div className={styles.welcome}>
          <HeartHands className={styles.heart} />
          <p className={styles.tagline}>
            Supporting your child, together<span className={styles.dot}>.</span>
          </p>
          <p className={styles.intro}>
            Welcome to Mirai, your connection to screening, reports and your child’s learning
            journey.
          </p>
        </div>
      </aside>

      <div className={styles.side}>
        <header className={styles.topBar}>
          <span className={styles.portal}>Parent portal</span>

          <Link to="/parent/sign-in" className={styles.account}>
            <UserIcon className={styles.userIcon} />
            Parent account
          </Link>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

function Decorations() {
  return (
    <div className={styles.decor} aria-hidden="true">
      <span className={`${styles.shape} ${styles.redTop}`} />
      <span className={`${styles.shape} ${styles.redRing}`} />
      <span className={`${styles.shape} ${styles.orangeLeft}`} />
      <Squiggle className={`${styles.shape} ${styles.squiggleTop}`} />

      <Wave className={`${styles.shape} ${styles.wave}`} />
      <Star className={`${styles.shape} ${styles.star}`} />
      <span className={`${styles.shape} ${styles.orangeRing}`} />
      <span className={`${styles.shape} ${styles.redBottom}`} />
      <span className={`${styles.shape} ${styles.orangeBottom}`} />
      <Squiggle className={`${styles.shape} ${styles.squiggleBottom}`} />
      <span className={`${styles.shape} ${styles.whiteRing}`} />
    </div>
  );
}

function Squiggle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 28" className={className} fill="none">
      <path
        d="M3 18c8 6 16 6 22-2s14-14 22-8c4 3 7 6 14 4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Wave({ className }: IconProps) {
  return (
    <svg viewBox="0 0 76 24" className={className} fill="none">
      <path
        d="M2 14c6 6 12 8 18 2s10-12 18-8 10 14 18 12 12-8 18-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Star({ className }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M50 2 63 36 99 38 71 61 81 97 50 77 19 97 29 61 1 38 37 36Z" fill="currentColor" />
    </svg>
  );
}

function HeartHands({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M24 42S5 30.5 5 17.5C5 11 10 6 16 6c3.6 0 6.4 1.8 8 4.4C25.6 7.8 28.4 6 32 6c6 0 11 5 11 11.5C43 30.5 24 42 24 42Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M15 22l6-5c1.6-1.3 3.8-1.2 5.3.2L34 24M24 20l-5 4.5c-1 .9-1 2.4 0 3.3s2.4.9 3.4 0L26 25M26 25l3.5 3.2M23.5 31l3 2.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
