import Image from "next/image";
import type { ReactNode } from "react";
import { HeartIcon, UserIcon } from "../icons";
import { Squiggle } from "../ui/Squiggle";

export type ShellRole = "parent" | "teacher" | "any";

interface Props {
  /** Shown under the logo, e.g. "Sign-in into the parent portal" */
  subtitle: string;
  /** Which portal this screen belongs to. "any" = not known yet (invitation / reset links). */
  role?: ShellRole;
  decor?: boolean;
  children: ReactNode;
}

const COPY: Record<
  ShellRole,
  { portal: string; account: string; title: string; body: string }
> = {
  parent: {
    portal: "Parent portal",
    account: "Parent account",
    title: "Supporting your child, together.",
    body: "Welcome to Mirai. Your connection to school helps you support your child’s learning journey.",
  },
  teacher: {
    portal: "Teacher portal",
    account: "Teacher account",
    title: "Help your students shine.",
    body: "Welcome to Mirai. Track progress, complete screenings and support every learner.",
  },
  any: {
    portal: "Mirai",
    account: "Your account",
    title: "Supporting learning, together.",
    body: "Welcome to Mirai. Families and teachers working side by side for every learner.",
  },
};

/** Two-column sign-in layout used by every public (signed-out) screen. */
export function AuthShell({
  subtitle,
  role = "parent",
  decor = false,
  children,
}: Props) {
  const copy = COPY[role];

  return (
    <div className="auth">
      <aside className="auth__panel">
        <Image
          src="/images/mirai-logo.png"
          alt="Mirai"
          width={113}
          height={53}
          priority
          className="auth__panel-logo"
        />
        <div className="auth__panel-copy">
          <Squiggle color="#f58220" />
          <HeartIcon size={40} className="auth__panel-heart" />
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
      </aside>

      <div className="auth__main">
        <div className="topbar topbar--auth">
          <span className="topbar__title">{copy.portal}</span>
          <span className="topbar__account">
            <UserIcon size={18} /> {copy.account}
          </span>
        </div>

        <header
          className={`auth__header ${decor ? "auth__header--decor" : ""}`}
        >
          {decor && (
            <>
              <span className="deco deco--red-fill" />
              <span className="deco deco--orange-fill" />
              <span className="deco deco--red-ring" />
              <Squiggle
                className="deco deco--squiggle"
                color="#f58220"
                width={59}
              />
            </>
          )}
          <Image
            src="/images/mirai-logo.png"
            alt="Mirai"
            width={113}
            height={53}
            priority
            className="auth__logo"
          />
          <p className="auth__subtitle">{subtitle}</p>
        </header>

        <main className="auth__content">{children}</main>
      </div>
    </div>
  );
}
