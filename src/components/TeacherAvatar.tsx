"use client";

import { initialsOf } from "@/services/session";
import type { User } from "@/types/api";
import styles from "./TeacherAvatar.module.css";

const IMG = "/images/teacher-home";

export default function TeacherAvatar({
  user,
  className = "",
}: {
  user?: Partial<User> | null;
  className?: string;
}) {
  return (
    <span className={`${styles.avatar} ${className}`} aria-hidden="true">
      <picture>
        <source media="(min-width: 1024px)" srcSet={`${IMG}/d-avatar.svg`} />
        <img src={`${IMG}/avatar.svg`} alt="" className={styles.circle} />
      </picture>
      <span className={styles.initials}>{initialsOf(user)}</span>
    </span>
  );
}
