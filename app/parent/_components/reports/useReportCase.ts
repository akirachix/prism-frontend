"use client";

import { useSearchParams } from "next/navigation";

export function useReportCaseId(): string | null {
  return useSearchParams().get("case_id");
}

export function withCase(href: string, caseId: string, extra = ""): string {
  return `${href}?case_id=${encodeURIComponent(caseId)}${extra}`;
}
