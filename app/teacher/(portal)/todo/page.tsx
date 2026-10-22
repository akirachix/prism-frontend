"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import IepReviewModal from "@/app/teacher/_components/IepReviewModal";
import TodoGroup from "@/app/teacher/_components/TodoGroup";
import TodoTabs, { type TodoTab } from "@/app/teacher/_components/TodoTabs";
import { errorMessage } from "@/lib/api";
import { getSession, TEACHER_ID } from "@/lib/session";
import {
  loadTodo,
  resendInvitation,
  type TodoData,
  type TodoEntry,
} from "@/lib/todo";
import "./todo-page.css";

const EMPTY: TodoData = { iep: [], evaluations: [], parents: [] };

export default function TodoPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TodoTab>("all");
  const [data, setData] = useState<TodoData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<TodoEntry | null>(null);

  useEffect(() => {
    const teacherId = getSession()?.user.user_id ?? TEACHER_ID;
    loadTodo(teacherId)
      .then(setData)
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const show = (key: TodoTab) => tab === "all" || tab === key;

  async function resend(entry: TodoEntry) {
    if (!entry.userId) return;
    const userId = entry.userId;
    setInvites((s) => ({ ...s, [userId]: "sending" }));
    try {
      await resendInvitation(userId);
      setInvites((s) => ({ ...s, [userId]: "sent" }));
    } catch (err) {
      setInvites((s) => ({ ...s, [userId]: errorMessage(err) }));
    }
  }

  function act(entry: TodoEntry) {
    if (entry.action === "Review") {
      setReviewing(entry);
    } else if (entry.action === "Start" || entry.action === "Start case") {
      router.push("/teacher/cases");
    }
  }

  const nothing =
    !loading &&
    !error &&
    (!show("iep") || data.iep.length === 0) &&
    (!show("evaluation") || data.evaluations.length === 0) &&
    (!show("parents") || data.parents.length === 0);

  return (
    <main className="todo-page">
      <h1 className="todo-page__title">To do</h1>
      <TodoTabs value={tab} onChange={setTab} />

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      {nothing && <p>You are all caught up.</p>}

      <div className="todo-page__columns">
        <div className="todo-page__col">
          {show("iep") && (
            <TodoGroup
              title="IEP(s)"
              items={data.iep.map((e) => ({ ...e, onAction: () => act(e) }))}
            />
          )}
          {show("parents") && (
            <TodoGroup
              title="Parents"
              items={data.parents.map((e) => {
                const state = invites[e.userId ?? ""];
                return {
                  ...e,
                  text:
                    state && state !== "sending" && state !== "sent"
                      ? state
                      : e.text,
                  action: state === "sent" ? "Invite sent" : e.action,
                  busy: state === "sending" || state === "sent",
                  onAction: () => resend(e),
                };
              })}
            />
          )}
        </div>
        <div className="todo-page__col">
          {show("evaluation") && (
            <TodoGroup
              title="Evaluations and Cases"
              items={data.evaluations.map((e) => ({
                ...e,
                onAction: () => act(e),
              }))}
            />
          )}
        </div>
      </div>

      {reviewing && (
        <IepReviewModal
          iepId={reviewing.id}
          studentName={reviewing.name}
          onClose={() => setReviewing(null)}
          onDone={(id) => {
            setData((d) => ({ ...d, iep: d.iep.filter((i) => i.id !== id) }));
            setReviewing(null);
          }}
        />
      )}
    </main>
  );
}
