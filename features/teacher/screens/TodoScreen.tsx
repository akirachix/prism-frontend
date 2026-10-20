"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorMessage, Loading } from "@/components/ui/StateMessage";
import { useAsync } from "@/lib/use-async";
import { teacherApi } from "../api";
import type { TodoKind } from "../types";
import styles from "./TodoScreen.module.css";

type Tab = "all" | TodoKind;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All" },
  { id: "iep", label: "IEP" },
  { id: "evaluation", label: "Evaluations" },
  { id: "referral", label: "Referrals" },
];

/** Teacher to-do list with filter tabs. The tasks are worked out from the teacher's cases and IEPs. */
export function TodoScreen() {
  const { data: todos, error, loading, reload } = useAsync(teacherApi.todos);
  const [tab, setTab] = useState<Tab>("all");

  const visible = (todos ?? []).filter((t) => tab === "all" || t.kind === tab);

  return (
    <>
      <PageHeader title="To do" />
      <div className={`page-body ${styles.body}`}>
        <div className={styles.tabs} role="tablist" aria-label="Filter tasks">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {todos && (
          <div className={styles.list}>
            {visible.length === 0 && <p className="subtle">Nothing to do here. 🎉</p>}
            {visible.map((todo) => (
              <div key={todo.id} className={styles.item}>
                <div>
                  <p className={styles.title}>{todo.title}</p>
                  <p className={styles.meta}>
                    {[todo.studentName, todo.dueDate && `Due ${todo.dueDate}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={styles.pill}>{todo.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
