"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/_components/SessionProvider";
import {
  Alert,
  Avatar,
  Empty,
  Loading,
  PageHeader,
} from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import TodoGroup, {
  type TodoItem,
} from "@/app/teacher/_components/todo/TodoGroup";
import TodoTabs, {
  type TodoTab,
} from "@/app/teacher/_components/todo/TodoTabs";
import { errorMessage } from "@/lib/api";
import { attentionItems, loadClassroom } from "@/lib/classroom";
import { studentName } from "@/lib/lookups";
import { fullName, usersApi, type UserRead } from "@/lib/users";
import "./todo-page.css";

interface ParentTodo {
  parent: UserRead;
  childName: string;
}

async function loadTodo(teacherId: string) {
  const room = await loadClassroom(teacherId);
  const parentIds = Array.from(
    new Set(
      room.students
        .map((s) => s.parent_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const results = await Promise.allSettled(
    parentIds.map((id) => usersApi.get(id)),
  );
  const parents: ParentTodo[] = [];
  results.forEach((result) => {
    if (result.status !== "fulfilled" || !result.value.must_change_password)
      return;
    const parent = result.value;
    const child = room.students.find((s) => s.parent_id === parent.user_id);
    parents.push({ parent, childName: child ? studentName(child) : "" });
  });
  return { items: attentionItems(room), parents };
}

export default function TodoView() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as TodoTab | null) ?? "all";
  const { data, error, loading } = useLoad(
    () => loadTodo(user.user_id),
    [user.user_id],
  );
  const [sent, setSent] = useState<Record<string, string>>({});

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
  const show = (key: TodoTab) => tab === "all" || tab === key;
  const toRow = (item: (typeof items)[number]): TodoItem => ({
    id: item.id,
    name: item.name,
    text: item.text,
    action: item.action,
    urgent: item.urgent,
    onAction: () => router.push(item.href),
  });
  const iepRows = items.filter((i) => i.kind === "iep").map(toRow);
  const evalRows = items.filter((i) => i.kind !== "iep").map(toRow);
  const parentRows: TodoItem[] = (data?.parents ?? []).map(
    ({ parent, childName }) => {
      const state = sent[parent.user_id];
      const failed = state && state !== "sending" && state !== "sent";
      return {
        id: parent.user_id,
        name: childName
          ? `${childName.split(" ")[0]}’s parent`
          : fullName(parent),
        text: failed ? state : "Has not signed in yet",
        action: state === "sent" ? "Invite sent" : "Resend invite",
        busy: state === "sending" || state === "sent",
        onAction: () => resend(parent),
      };
    },
  );

  const nothing =
    !loading &&
    !error &&
    (!show("iep") || iepRows.length === 0) &&
    (!show("evaluation") || evalRows.length === 0) &&
    (!show("parents") || parentRows.length === 0);

  return (
    <main className="ui-page">
      <PageHeader
        title="To do"
        avatar={
          <Avatar
            name={fullName(user)}
            id={user.user_id}
            colour="#d62839"
            size={44}
          />
        }
      />
      <div className="ui-body">
        <TodoTabs
          value={tab}
          onChange={(key) =>
            router.replace(
              key === "all" ? "/teacher/todo" : `/teacher/todo?tab=${key}`,
            )
          }
        />

        {loading && <Loading />}
        {error && <Alert>{error}</Alert>}
        {nothing && <Empty>You are all caught up.</Empty>}

        {data && (
          <div className="todo-page__columns">
            <div className="todo-page__col">
              {show("iep") && <TodoGroup title="IEP(s)" items={iepRows} />}
              {show("parents") && (
                <TodoGroup title="Parents" items={parentRows} />
              )}
            </div>
            <div className="todo-page__col">
              {show("evaluation") && (
                <TodoGroup title="Evaluations and Cases" items={evalRows} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
