import { CircleUserRound } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import "./auth-layout.css";

export default function AuthLayout({
  portal,
  panelTitle,
  panelText,
  mobileHeader = "hero",
  mobileTitle,
  mobileText,
  showTopbar = false,
  children,
}: {
  portal: "teacher" | "parent";
  panelTitle: ReactNode;
  panelText: ReactNode;
  mobileHeader?: "hero" | "bar" | "plain";
  mobileTitle?: ReactNode;
  mobileText?: ReactNode;
  showTopbar?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`auth auth--${portal} auth--mobile-${mobileHeader}`}>
      <aside className="auth__panel">
        {portal === "teacher" && (
          <Image
            src="/mirai-logo.png"
            alt="Mirai"
            width={226}
            height={103}
            priority
            className="auth__logo"
          />
        )}
        <div className="auth__panel-copy">
          <h1 className="auth__panel-title">{panelTitle}</h1>
          <p className="auth__panel-text">{panelText}</p>
        </div>
      </aside>

      <header className="auth__mobile-header">
        {mobileHeader === "plain" ? (
          <Image
            src="/mirai-logo-navy.png"
            alt="Mirai"
            width={226}
            height={103}
            priority
            className="auth__mobile-logo"
          />
        ) : (
          <>
            {mobileHeader === "bar" && (
              <Image
                src="/mirai-logo.png"
                alt="Mirai"
                width={226}
                height={103}
                priority
                className="auth__mobile-logo"
              />
            )}
            {mobileTitle && <p className="auth__mobile-title">{mobileTitle}</p>}
            {mobileText && <p className="auth__mobile-text">{mobileText}</p>}
          </>
        )}
      </header>

      <main className="auth__main">
        {showTopbar && portal === "parent" && (
          <div className="auth__topbar">
            <span>Parent portal</span>
            <span className="auth__topbar-account">
              <CircleUserRound size={26} aria-hidden="true" />
              Parent account
            </span>
          </div>
        )}
        <div className="auth__content">{children}</div>
      </main>
    </div>
  );
}
