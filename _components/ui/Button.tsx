import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import "./ui.css";

export type ButtonVariant =
  "primary" | "outline" | "orange" | "danger-outline" | "link";

interface Common {
  variant?: ButtonVariant;
  block?: boolean;
  small?: boolean;
  loading?: boolean;
  children: ReactNode;
}

function classes(
  { variant = "primary", block, small }: Omit<Common, "children">,
  extra?: string,
) {
  return [
    "ui-btn",
    `ui-btn--${variant}`,
    block ? "ui-btn--block" : "",
    small ? "ui-btn--small" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant,
  block,
  small,
  loading,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={classes({ variant, block, small }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  block,
  small,
  children,
  className,
  href,
  ...rest
}: Omit<Common, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={classes({ variant, block, small }, className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
