import { ArrowLeft, Lock, Mail, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { avatarColour, initials, type PillTone } from "@/lib/format";
import "./ui.css";

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "success" | "warning";
  children: ReactNode;
}) {
  return (
    <div
      className={`ui-alert ui-alert--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {tone === "warning" && <TriangleAlert size={22} aria-hidden="true" />}
      <div>{children}</div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="ui-note">{children}</div>;
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="ui-disclaimer">
      <TriangleAlert size={20} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export type { PillTone };

export function Pill({
  tone = "outline",
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return <span className={`ui-pill ui-pill--${tone}`}>{children}</span>;
}

export function Avatar({
  name,
  id,
  size = 44,
  colour,
}: {
  name: string;
  id?: string;
  size?: number;
  colour?: string;
}) {
  const background = colour ?? avatarColour(id ?? name);
  const light = background === "#b8d4e8";
  return (
    <span
      className="ui-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background,
        color: light ? "#0a2a66" : "#ffffff",
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  eyebrow,
  back,
  close,
  avatar,
  actions,
  children,
  tall,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label?: string };
  close?: { href: string; label?: string };
  avatar?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  tall?: boolean;
}) {
  return (
    <header className={tall ? "ui-header ui-header--tall" : "ui-header"}>
      <div className="ui-header__row">
        {back && (
          <Link
            href={back.href}
            className="ui-header__back"
            aria-label={back.label ?? "Back"}
          >
            <ArrowLeft size={22} aria-hidden="true" />
            {eyebrow && <span className="ui-header__eyebrow">{eyebrow}</span>}
          </Link>
        )}
        {close && (
          <Link
            href={close.href}
            className="ui-header__back"
            aria-label={close.label ?? "Close"}
          >
            <X size={24} aria-hidden="true" />
          </Link>
        )}
        {!back && eyebrow && (
          <span className="ui-header__eyebrow">{eyebrow}</span>
        )}
        {actions && <div className="ui-header__actions">{actions}</div>}
      </div>
      <div className="ui-header__title-row">
        {avatar}
        <h1 className="ui-header__title">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="ui-loading" role="status">
      <span className="ui-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="ui-empty">{children}</p>;
}

export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="ui-badge" aria-hidden="true">
      <span className="ui-badge__ring" />
      <span className="ui-badge__square">{children}</span>
      <span className="ui-badge__dot ui-badge__dot--red" />
      <span className="ui-badge__dot ui-badge__dot--orange" />
    </div>
  );
}

export function MailBadge() {
  return (
    <IconBadge>
      <Mail size={36} strokeWidth={1.6} />
    </IconBadge>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "red",
}: {
  value: number;
  max: number;
  label?: string;
  tone?: "red" | "orange";
}) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      className={`ui-progress ui-progress--${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <span className="ui-progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function LockedCard({
  title,
  text,
  week,
  total,
}: {
  title: string;
  text: string;
  week?: number;
  total?: number;
}) {
  return (
    <div className="ui-card ui-locked">
      <Lock size={30} aria-hidden="true" />
      <h2 className="ui-locked__title">{title}</h2>
      <p className="ui-locked__text">{text}</p>
      {week !== undefined && total !== undefined && (
        <>
          <ProgressBar
            value={week}
            max={total}
            tone="orange"
            label="Weeks passed"
          />
          <p className="ui-locked__week">
            Week {week} of {total}
          </p>
        </>
      )}
    </div>
  );
}
