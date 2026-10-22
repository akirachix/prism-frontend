"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useUser } from "@/app/_components/SessionProvider";
import Button, { ButtonLink } from "@/app/_components/ui/Button";
import { Alert, Avatar, Empty, Loading, PageHeader } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { errorMessage } from "@/lib/api";
import { attentionItems, loadClassroom, type AttentionItem } from "@/lib/classroom";
import { studentName } from "@/lib/lookups";
import { fullName, usersApi, type UserRead } from "@/lib/users";
import "@/app/_components/portal.css";

type Tab = "all" | "iep" | "evaluation" | "parents";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "iep", label: "IEP" },
  { key: "evaluation", label: "Evaluations" },
  { key: "parents", label: "Parents" },
];

interface ParentTodo {
  parent: UserRead;
  childName: string;
}

async function loadTodo(teacherId: string) {
  const room = await loadClassroom(teacherId);
  const parentIds = Array.from(
    new Set(room.students.map((s) => s.parent_id).filter((id): id is string => Boolean(id))),
  );
  const results = await Promise.allSettled(parentIds.map((id) => usersApi.get(id)));
  const parents: ParentTodo[] = [];
  results.forEach((result) => {
    if (result.status !== "fulfilled" || !result.value.must_change_password) return;
    const parent = result.value;
    const child = room.students.find((s) => s.parent_id === parent.user_id);
    parents.push({ parent, childName: child ? studentName(child) : "" });
  });
  return { items: attentionItems(room), parents };
}

function Group({ title, items }: { title: string; items: AttentionItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="portal-group">
      <h2 className="portal-group__title">{title}</h2>
      <ul className="portal-group__card">
        {items.map((item) => (
          <li key={item.id}>
            <span>
              <span className="portal-group__name">{item.name}</span>
              <span className="portal-group__text">{item.text}</span>
            </span>
            <ButtonLink href={item.href} small variant={item.urgent ? "primary" : "outline"}>
              {item.action}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TodoView() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab | null) ?? "all";
  const { data, error, loading } = useLoad(() => loadTodo(user.user_id), [user.user_id]);
  const [sent, setSent] = useState<Record<string, "sending" | "sent" | string>>({});

  async function resend(parent: UserRead) {
    setSent((s) => ({ ...s, [parent.user_id]: "sending" }));
    try {
      await usersApi.resendInvitation(parent.user_id);
      setSent((s) => ({ ...s, [parent.user_id]: "sent" }));
    } catch (err) {
      setSent((s) => ({ ...s, [parent.user_id]: errorMessage(err) }));
    }
  }

  const items = data?.items ?? [];
  const show = (key: Tab) => tab === "all" || tab === key;
  const iepItems = items.filter((i) => i.kind === "iep");
  const evalItems = items.filter((i) => i.kind !== "iep");
  const nothing =
    !loading &&
    !error &&
    (!show("iep") || iepItems.length === 0) &&
    (!show("evaluation") || evalItems.length === 0) &&
    (!show("parents") || (data?.parents.length ?? 0) === 0);

  return (
    <main className="ui-page">
      <PageHeader
        title="To do"
        avatar={<Avatar name={fullName(user)} id={user.user_id} colour="#d62839" size={44} />}
      />
      <div className="ui-body">
        <div className="portal-chips" role="group" aria-label="Show">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="portal-chip"
              aria-pressed={tab === item.key}
              onClick={() => router.replace(item.key === "all" ? "/teacher/todo" : `/teacher/todo?tab=${item.key}`)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && <Loading />}
        {error && <Alert>{error}</Alert>}
        {nothing && <Empty>You are all caught up.</Empty>}

        {data && (
          <div className="portal-columns">
            <div className="portal-section">
              {show("iep") && <Group title="IEP(s)" items={iepItems} />}
              {show("parents") && data.parents.length > 0 && (
                <section className="portal-group">
                  <h2 className="portal-group__title">Parents</h2>
                  <ul className="portal-group__card">
                    {data.parents.map(({ parent, childName }) => {
                      const state = sent[parent.user_id];
                      return (
                        <li key={parent.user_id}>
                          <span>
                            <span className="portal-group__name">
                              {childName ? `${childName.split(" ")[0]}’s parent` : fullName(parent)}
                            </span>
                            <span className="portal-group__text">
                              {state && state !== "sending" && state !== "sent" ? state : "Has not signed in yet"}
                            </span>
                          </span>
                          <Button
                            small
                            variant="outline"
                            loading={state === "sending"}
                            disabled={state === "sent"}
                            onClick={() => resend(parent)}
                          >
                            {state === "sent" ? "Invite sent" : "Resend invite"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
            {show("evaluation") && <Group title="Evaluations and Cases" items={evalItems} />}
          </div>
        )}
      </div>
    </main>
  );
}
