"use client";

import { useSearchParams } from "next/navigation";

/** The case whose reports to show, from `?case_id=` in the address. */
export function useReportCaseId(): string | null {
  return useSearchParams().get("case_id");
}

/** Add the case to a link so it survives moving between report pages. */
export function withCase(href: string, caseId: string, extra = ""): string {
  return `${href}?case_id=${encodeURIComponent(caseId)}${extra}`;
}
