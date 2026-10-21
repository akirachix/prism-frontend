"use client";

import Link from "next/link";

import { useUser } from "@/app/_components/SessionProvider";
import { Loading, PageHeader } from "@/app/_components/ui/bits";
import { studentName } from "@/lib/lookups";
import { useChild } from "../_components/ChildProvider";
import "@/app/_components/portal.css";

/**
 * Where a parent lands after signing in.
 * The parent Home feature (students and screening) replaces this page.
 */
export default function ParentHomePage() {
  const user = useUser();
  const { child, loading } = useChild();
  return (
    <main className="ui-page">
      <PageHeader title="Home" />
      <div className="ui-body">
        <h2 className="ui-section-title">
          Hello, {user.first_name || "parent"} 👋
        </h2>
        {loading ? (
          <Loading />
        ) : (
          <p className="ui-text">
            {child
              ? `Your child: ${studentName(child)}`
              : "Your account is not linked to a child yet."}
          </p>
        )}
        <ul className="portal-menu">
          <li>
            <Link href="/parent/account">Profile</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
