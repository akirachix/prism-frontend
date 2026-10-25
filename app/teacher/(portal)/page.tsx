"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useUser } from "@/_components/SessionProvider";
import { ButtonLink } from "@/_components/ui/Button";
import { Alert, Avatar, Empty, Loading } from "@/_components/ui/bits";
import LatestUpdates from "@/_components/updates/LatestUpdates";
import { useLoad } from "@/_components/useLoad";
import { attentionItems, loadClassroom } from "@/lib/classroom";
import {
  notificationUpdates,
  teacherEvaluationUpdates,
} from "@/lib/evaluation-updates";
import { greeting } from "@/lib/format";
import { notificationsApi } from "@/lib/notifications";
import { fullName } from "@/lib/users";
import "@/_components/plan/plan.css";
import "./page.module.css";

export default function TeacherHomePage() {
  const user = useUser();
  const room = useLoad(() => loadClassroom(user.user_id), [user.user_id]);
  const news = useLoad(
    () => notificationsApi.list(user.user_id),
    [user.user_id],
  );
  const data = room.data;
  // 6-week check reminders and the parents' evaluations, per active plan.
  const activePlans = data
    ? Array.from(data.iepByCase.values())
        .filter((iep) => iep.status === "ACTIVE")
        .map((iep) => iep.iep_id)
    : null;
  const checks = useLoad(
    () => (data ? teacherEvaluationUpdates(data) : Promise.resolve([])),
    [activePlans],
  );
  const updates = [
    ...notificationUpdates(news.data ?? []),
    ...(checks.data ?? []),
  ];

  const openCases = data?.cases.filter((item) => !item.closed_at).length ?? 0;
  const ieps = data ? Array.from(data.iepByCase.values()) : [];
  const active = ieps.filter((iep) => iep.status === "ACTIVE").length;
  const unapproved = ieps.filter(
    (iep) => iep.status === "PENDING_APPROVAL",
  ).length;
  const attention = data ? attentionItems(data).slice(0, 3) : [];

  const tiles: {
    label: string;
    value: number | undefined;
    tone: string;
    href?: string;
  }[] = [
    {
      label: data?.students.length === 1 ? "Student" : "Students",
      value: data?.students.length,
      tone: "peach",
      href: "/teacher/students",
    },
    {
      label: "Open cases",
      value: openCases,
      tone: "sky",
      href: "/teacher/cases",
    },
    {
      label: "Active IEP",
      value: active,
      tone: "pink",
      href: "/teacher/students?filter=plan",
    },
    {
      label: "Unapproved IEP",
      value: unapproved,
      tone: "grey",
      href: "/teacher/todo?tab=iep",
    },
  ];

  return (
    <main className="ui-page">
      <header className="ui-header portal-home__header">
        <div className="ui-header__title-row">
          <Avatar
            name={fullName(user)}
            id={user.user_id}
            colour="#d62839"
            size={52}
          />
          <h1 className="ui-header__title">
            <span className="portal-mobile-only">{greeting()}, </span>
            <span className="portal-desktop-only">Hello </span>
            {user.first_name}!
          </h1>
        </div>
        <div className="portal-tiles">
          {tiles.map((tile) => {
            const className = `portal-tile portal-tile--${tile.tone}`;
            const body = (
              <>
                <span className="portal-tile__value">
                  {room.loading ? "–" : (tile.value ?? 0)}
                </span>
                <span className="portal-tile__label">{tile.label}</span>
              </>
            );
            return tile.href ? (
              <Link key={tile.label} href={tile.href} className={className}>
                {body}
              </Link>
            ) : (
              <div key={tile.label} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      </header>

      <div className="ui-body">
        {room.error && <Alert>{room.error}</Alert>}

        <ButtonLink
          href="/teacher/students?filter=plan"
          className="portal-home__plans"
        >
          View education plans (IEPs)
          <ArrowRight size={18} aria-hidden="true" />
        </ButtonLink>

        <section className="portal-section" aria-labelledby="attention-title">
          <div className="ui-row-between">
            <h2 id="attention-title" className="ui-section-title">
              Needs your attention
            </h2>
            <Link href="/teacher/todo" className="portal-see-all">
              See all
            </Link>
          </div>
          {room.loading ? (
            <Loading />
          ) : attention.length === 0 ? (
            <Empty>Nothing needs you right now.</Empty>
          ) : (
            <ul className="portal-attention">
              {attention.map((item) => (
                <li key={item.id}>
                  <div className="portal-attention__item">
                    <span>
                      <span className="portal-attention__name">
                        {item.name}
                      </span>
                      <span className="portal-attention__text">
                        {item.text}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="portal-section" aria-labelledby="latest-title">
          <h2 id="latest-title" className="ui-section-title">
            Latest actions
          </h2>
          <LatestUpdates
            items={updates}
            loading={news.loading || checks.loading || room.loading}
            error={news.error}
          />
        </section>
      </div>
    </main>
  );
}
