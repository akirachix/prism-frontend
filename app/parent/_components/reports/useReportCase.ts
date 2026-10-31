"use client";

import { useSearchParams } from "next/navigation";

import { useChild } from "../ChildProvider";

export interface ReportCase {
  caseId: string | null;
  loading: boolean;
}

export function useReportCase(): ReportCase {
  const fromLink = useSearchParams().get("case_id");
  const { caseItem, loading } = useChild();
  if (fromLink) return { caseId: fromLink, loading: false };
  return { caseId: caseItem?.case_id ?? null, loading };
}

export function useReportCaseId(): string | null {
  return useReportCase().caseId;
}

export function withCase(href: string, caseId: string, extra = ""): string {
  return `${href}?case_id=${encodeURIComponent(caseId)}${extra}`;
}
