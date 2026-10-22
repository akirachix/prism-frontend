"use client";

import { ChevronRight, KeyRound, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { orNull, useLoad } from "../useLoad";
import { useUser } from "../SessionProvider";
import { ButtonLink } from "../ui/Button";
import { Avatar, PageHeader } from "../ui/bits";
import { schoolsApi } from "@/lib/schools";
import { fullName } from "@/lib/users";
import "../portal.css";
import "./account.css";

export default function AccountView({ portal }: { portal: "teacher" | "parent" }) {
  const user = useUser();
  const school = useLoad(
    () => (user.school_id ? orNull(schoolsApi.get(user.school_id)) : Promise.resolve(null)),
    [user.school_id],
  );
  const base = `/${portal}/account`;
  const role = portal === "teacher" ? "Teacher" : "Parent account";

  return (
    <main className="ui-page">
      <PageHeader title={portal === "teacher" ? "Account" : "Profile"} />
      <div className="ui-body ui-body--narrow account">
        <section className="ui-card account__card ui-lift">
          <Avatar name={fullName(user)} id={user.user_id} colour="#d62839" size={64} />
          <div>
            <p className="account__name">{fullName(user)}</p>
            <p className="account__meta">{role}</p>
            {school.data && <p className="account__meta">{school.data.name}</p>}
          </div>
        </section>

        <section aria-labelledby="profile-title" className="account__section">
          <h2 id="profile-title" className="ui-section-title">Profile</h2>
          <dl className="ui-card portal-kv">
            <div className="portal-kv__row">
              <dt>Name</dt>
              <dd>{fullName(user)}</dd>
            </div>
            <div className="portal-kv__row">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="portal-kv__row">
              <dt>Phone</dt>
              <dd>{user.phone || "—"}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="security-title" className="account__section">
          <h2 id="security-title" className="ui-section-title">Security</h2>
          <ul className="portal-menu">
            <li>
              <Link href={`${base}/password`}>
                <span className="account__menu-label">
                  <KeyRound size={20} aria-hidden="true" /> Change password
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href={`${base}/edit`}>
                <span className="account__menu-label">
                  <UserRound size={20} aria-hidden="true" /> Edit profile
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </section>

        <div className="ui-actions">
          <ButtonLink href={`${base}/sign-out`} variant="danger-outline" className="account__signout">
            <LogOut size={18} aria-hidden="true" /> Sign out
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
