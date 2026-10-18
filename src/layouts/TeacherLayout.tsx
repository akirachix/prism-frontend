"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "@/lib/router";

import MaskIcon from "@/components/MaskIcon";
import OfflineBanner from "@/components/OfflineBanner";
import { SESSION_EXPIRED_EVENT } from "@/services/apiClient";
import { getSession } from "@/services/session";
import { todoService } from "@/services/todos";
import styles from "./TeacherLayout.module.css";

const IMG = "/images/teacher-home";

export const TEACHER_AUTH_PAGES = [
  "/teacher/sign-in",
  "/teacher/change-password",
  "/teacher/verify-email",
  "/teacher/forgot-password",
];

const NAV = [
  { to: "/teacher", label: "Home", icon: "icon-home.svg", end: true },
  { to: "/teacher/students", label: "Students", icon: "icon-students.svg" },
  { to: "/teacher/todo", label: "To Do", icon: "icon-todo.svg" },
  { to: "/teacher/account", label: "Account", icon: "icon-account.svg" },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const signedIn = Boolean(getSession()?.user);
  const [todoCount, setTodoCount] = useState(0);

  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const onExpired = () => setExpired(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!signedIn) return undefined;
    let live = true;
    todoService
      .list({ limit: 100 })
      .then((todos) => live && setTodoCount(todos.length))
      .catch(() => live && setTodoCount(0));
    return () => {
      live = false;
    };
  }, [pathname, signedIn]);

  if (TEACHER_AUTH_PAGES.includes(pathname.replace(/\/$/, ""))) return <>{children}</>;

  if (!signedIn) {
    return (
      <Navigate
        to="/teacher/sign-in"
        replace
        state={expired ? { notice: "You were signed out. Please sign in again." } : undefined}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo} aria-hidden="true">
          <img src={`${IMG}/logo-white.svg`} alt="" className={styles.logoMark} />
          <span className={styles.logoText}>mirai</span>
        </div>
        <nav aria-label="Main" className={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.iconWrap}>
                <MaskIcon src={`${IMG}/${item.icon}`} className={styles.icon} />
                {item.to === "/teacher/todo" && todoCount > 0 && (
                  <span className={styles.badge} aria-hidden="true">
                    {todoCount > 99 ? "99+" : todoCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {item.to === "/teacher/todo" && todoCount > 0 && (
                <span className="sr-only"> ({todoCount} waiting)</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        <OfflineBanner />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
