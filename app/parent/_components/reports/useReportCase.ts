"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { getStudents, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";

export function useReportCaseId(): string | null {
  return useSearchParams().get("case_id");
}

/** Add the case to a link so it survives moving between report pages. */
export function withCase(href: string, caseId: string, extra = ""): string {
  return `${href}?case_id=${encodeURIComponent(caseId)}${extra}`;
}

export interface ReportChild {
  caseItem: Case;
  student: Student | null;
}

export function useReportChild(caseId: string | null) {
  const [data, setData] = useState<ReportChild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(caseId));

  useEffect(() => {
    if (!caseId) return;
    let active = true;
    Promise.all([
      casesApi.get(caseId),
      getStudents().catch(() => [] as Student[]),
    ])
      .then(([caseItem, students]) => {
        if (!active) return;
        setData({
          caseItem,
          student:
            students.find((s) => s.student_id === caseItem.student_id) ?? null,
        });
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  return { data, error, loading };
}
