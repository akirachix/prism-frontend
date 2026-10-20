import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "outline" | "link";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Renders a link (styled as a button) instead of a <button>. */
  href?: string;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  href,
  loading,
  disabled,
  className = "",
  type = "button",
  children,
  ...rest
}: Props) {
  const cls = `btn btn--${variant} ${className}`.trim();
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} type={type} disabled={disabled || loading} {...rest}>
      {loading ? "Please wait…" : children}
    </button>
  );
}
