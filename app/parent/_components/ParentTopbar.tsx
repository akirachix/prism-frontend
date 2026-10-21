import Link from "next/link";
import { CircleUserRound } from "lucide-react";

export default function ParentTopbar() {
  return (
    <header className="portal-topbar" aria-label="Parent portal">
      <span>Parent portal</span>
      <Link href="/parent/account" className="portal-topbar__account">
        <CircleUserRound size={20} aria-hidden="true" />
        <span>Account</span>
      </Link>
      <span className="portal-topbar__squiggle" aria-hidden="true">
        ~
      </span>
    </header>
  );
}
