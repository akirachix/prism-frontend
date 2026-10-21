"use client";

import Link from "next/link";

import { useUser } from "@/app/_components/SessionProvider";
import { Avatar, PageHeader } from "@/app/_components/ui/bits";
import { fullName } from "@/lib/users";
import "@/app/_components/portal.css";

/**
 * Where a teacher lands after signing in.
 * The Home dashboard feature replaces this page.
 */
export default function TeacherHomePage() {
  const user = useUser();
  return (
    <main className="ui-page">
      <PageHeader
        title={`Hello ${user.first_name}!`}
        avatar={
          <Avatar
            name={fullName(user)}
            id={user.user_id}
            colour="#d62839"
            size={52}
          />
        }
      />
      <div className="ui-body">
        <ul className="portal-menu">
          <li>
            <Link href="/teacher/cases">Cases</Link>
          </li>
          <li>
            <Link href="/teacher/account">Account</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
