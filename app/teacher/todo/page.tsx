"use client";

import { useEffect, useState } from "react";

import TodoGroup from "@/app/teacher/_components/TodoGroup";
import TodoTabs, { type TodoTab } from "@/app/teacher/_components/TodoTabs";
import { ApiError, errorMessage } from "@/lib/api";
import { loadIepTodo, type IepTodo } from "@/lib/todo";
import "./todo-page.css";

export default function TodoPage() {
  const [tab, setTab] = useState<TodoTab>("all");
  const [iepItems, setIepItems] = useState<IepTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIepTodo()
      .then(setIepItems)
      .catch((err: ApiError | Error) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const show = (key: TodoTab) => tab === "all" || tab === key;

  return (
    <main className="todo-page">
      <h1 className="todo-page__title">To do</h1>
      <TodoTabs value={tab} onChange={setTab} />

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && iepItems.length === 0 && show("iep") && (
        <p>You are all caught up.</p>
      )}

      {show("iep") && (
        <TodoGroup
          title="IEP(s)"
          items={iepItems.map((item) => ({
            id: item.id,
            name: item.name,
            text: item.text,
            action: item.action,
            urgent: item.action === "Review",
            onAction: () => {},
          }))}
        />
      )}
    </main>
  );
}
