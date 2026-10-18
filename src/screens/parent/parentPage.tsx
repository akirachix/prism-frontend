"use client";

import { useEffect, useState } from "react";

import type { ParentChild, ReportKind } from "@/types/api";
import { messageOf } from "@/services/apiClient";
import { childService } from "@/services/children";
import { reportFileService, saveFile } from "@/services/reportFiles";
import { selectChild, useSelectedChildId } from "./selectedChild";
import styles from "./ParentPage.module.css";

type IconProps = { className?: string };

export const REPORT_TITLES: Record<ReportKind, string> = {
  screening: "Screening report",
  evaluation: "Evaluation report",
};

export function longDay(iso: string | null | undefined): string {
  if (!iso) return "—";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function useReportChild() {
  const selectedId = useSelectedChildId();
  const [state, setState] = useState<{ status: string; children: ParentChild[]; error: string }>({
    status: "loading",
    children: [],
    error: "",
  });

  function load() {
    setState({ status: "loading", children: [], error: "" });
    childService
      .listMine()
      .then((children) => setState({ status: "ready", children, error: "" }))
      .catch((e) => setState({ status: "error", children: [], error: messageOf(e) }));
  }

  useEffect(load, []);

  const { children } = state;
  const child =
    children.find((c) => c.student_id === selectedId) ??
    children.find((c) => c.case_id) ??
    children[0] ??
    null;
  const picker =
    child && children.length > 1 ? (
      <ChildPicker items={children} selected={child.student_id} />
    ) : null;
  return { status: state.status, error: state.error, child, children, picker, retry: load };
}

export function ChildPicker({ items, selected }: { items: ParentChild[]; selected: string }) {
  return (
    <div className={styles.picker}>
      <label htmlFor="child-picker" className={styles.pickerLabel}>
        Showing
      </label>
      <select
        id="child-picker"
        className={styles.pickerSelect}
        value={selected}
        onChange={(e) => selectChild(e.target.value)}
      >
        {items.map((c) => (
          <option key={c.student_id} value={c.student_id}>
            {c.first_name} {c.last_name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function usePdfDownload(caseId: string | null | undefined) {
  const [busy, setBusy] = useState<ReportKind | null>(null);
  const [error, setError] = useState("");

  async function download(kind: ReportKind, childFirstName: string) {
    if (!caseId) return;
    setBusy(kind);
    setError("");
    try {
      const { blob, filename } = await reportFileService.pdf(caseId, kind);
      saveFile(blob, filename || `${kind}-report-${childFirstName.toLowerCase()}.pdf`);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  }

  return { busy, error, download };
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 4h22l10 10v30H8z" />
      <path d="M30 4v10h10M15 17h5M15 26h18M15 33h18" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 10 16"
      className={className}
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2l6 6-6 6" />
    </svg>
  );
}

export function Squiggle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 76 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M2 14c6 6 12 8 18 2s10-12 18-8 10 14 18 12 12-8 18-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
