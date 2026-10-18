"use client";

import { Link, Navigate } from "@/lib/router";
import { getSession } from "@/services/session";
import styles from "./StartPage.module.css";

type IconProps = { className?: string };

const CHOICES = [
  {
    to: "/teacher/sign-in",
    title: "Teacher",
    text: "Screen the students in my class and follow their support plans.",
    Icon: TeacherIcon,
  },
  {
    to: "/parent/sign-in",
    title: "Parent",
    text: "See my child’s screening, reports and home activities.",
    Icon: ParentIcon,
  },
];

export default function StartPage() {
  const role = getSession()?.user?.role;
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "parent") return <Navigate to="/parent" replace />;

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <span className={styles.redCircle} aria-hidden="true" />
        <span className={styles.orangeRing} aria-hidden="true" />
        <span className={styles.whiteRing} aria-hidden="true" />
        <div className={styles.logo}>
          <img src="/images/teacher-home/logo-white.svg" alt="" className={styles.logoMark} />
          <span className={styles.logoText}>mirai</span>
        </div>
        <p className={styles.tagline}>
          Noticing early, supporting together<span className={styles.dot}>.</span>
        </p>
        <p className={styles.intro}>
          Teachers and parents use mirai to spot early signs that a child may need extra support,
          and to follow that support at school and at home.
        </p>
      </aside>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to mirai</h1>
        <p className={styles.lead}>Who is signing in?</p>

        <ul className={styles.choices}>
          {CHOICES.map(({ to, title, text, Icon }) => (
            <li key={to}>
              <Link to={to} className={styles.card}>
                <span className={styles.iconBox} aria-hidden="true">
                  <Icon className={styles.icon} />
                </span>
                <span className={styles.cardText}>
                  <span className={styles.cardTitle}>{title}</span>
                  <span className={styles.cardSub}>{text}</span>
                </span>
                <ChevronIcon className={styles.chevron} />
              </Link>
            </li>
          ))}
        </ul>

        <p className={styles.note}>
          <strong>First time here?</strong> Teachers sign in with the account their school
          administrator made. Parents start from the invitation email the school sent.
        </p>
        <p className={styles.disclaimer}>Mirai is a screening tool. It never gives a diagnosis.</p>
      </main>
    </div>
  );
}

function TeacherIcon({ className }: IconProps) {
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
      <rect x="9" y="3.5" width="12" height="9" rx="1" />
      <path d="M12 7h6M12 9.5h4" />
      <circle cx="5.5" cy="8" r="2.5" />
      <path d="M1.5 20.5v-3.2a4 4 0 0 1 4-4h1.2l3.3-2.3" />
      <path d="M9.5 20.5v-4.5" />
    </svg>
  );
}

function ParentIcon({ className }: IconProps) {
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
      <circle cx="8" cy="5.5" r="2.8" />
      <path d="M2.5 20.5v-4.3a5.5 5.5 0 0 1 11 0v4.3" />
      <circle cx="17.5" cy="10" r="2.2" />
      <path d="M14.5 20.5v-2.6a3 3 0 0 1 6 0v2.6" />
    </svg>
  );
}

function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 9 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m1 1 7 7-7 7" />
    </svg>
  );
}
