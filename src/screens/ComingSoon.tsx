"use client";

import { Link } from "@/lib/router";
import styles from "./ComingSoon.module.css";

export default function ComingSoon() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="coming-soon-title">
        <span className={styles.badge} aria-hidden="true">
          <ToolsIcon className={styles.icon} />
        </span>
        <h1 id="coming-soon-title" className={styles.title}>
          Coming soon
        </h1>
        <p className={styles.text}>
          This part of mirai is still being built. Please check back soon.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => window.history.back()}>
            Go back
          </button>
          <Link to="/" className={styles.primary}>
            Start page
          </Link>
        </div>
      </section>
    </main>
  );
}

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.4 1.4 0 0 0 2 2l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2z" />
      <path d="M16 15l4 4" />
      <path d="M13.5 17.5 18 13" />
    </svg>
  );
}
