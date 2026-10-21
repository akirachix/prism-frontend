import { CircleUserRound } from "lucide-react";
import Link from "next/link";

export default function ParentTopbar() {
  return (
    <div className="portal-topbar">
      <span>Parent portal</span>
      <Link href="/parent/account" className="portal-topbar__account">
        <CircleUserRound size={26} aria-hidden="true" />
        Parent account
      </Link>
      <svg
        className="portal-topbar__squiggle"
        width="64"
        height="20"
        viewBox="0 0 64 20"
        aria-hidden="true"
      >
        <path
          d="M2 14c8-10 14-10 20 0s14 10 20 0 14-10 20 0"
          fill="none"
          stroke="#ff8c42"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
