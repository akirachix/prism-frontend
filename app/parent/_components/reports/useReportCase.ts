"use client";

import { useSearchParams } from "next/navigation";

import { useChild } from "@/app/parent/_components/ChildProvider";

export interface ReportCase {
  caseId: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * The case to show reports for: the one in the link (?case_id=…), or else the
 * case of the child picked in the parent portal, so the menu link works too.
 */
export function useReportCase(): ReportCase {
  const fromLink = useSearchParams().get("case_id");
  const { caseItem, loading, error, reload } = useChild();
  if (fromLink) {
    return { caseId: fromLink, loading: false, error: null, retry: reload };
  }
  return {
    caseId: caseItem?.case_id ?? null,
    loading,
    error,
    retry: reload,
  };
}

export function useReportCaseId(): string | null {
  return useReportCase().caseId;
}

export function withCase(href: string, caseId: string, extra = ""): string {
  return `${href}?case_id=${encodeURIComponent(caseId)}${extra}`;
}
