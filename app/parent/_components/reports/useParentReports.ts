"use client";

import { useCallback, useEffect, useState } from "react";

import { errorMessage } from "@/lib/api";
import {
  loadParentReports,
  loadReportChild,
  type ParentReportErrors,
  type ParentReports,
  type ReportChild,
} from "@/lib/reports";

interface ReportsState {
  /** The case this state was loaded for. */
  caseId: string | null;
  child: ReportChild | null;
  childError: string | null;
  reports: ParentReports | null;
  errors: ParentReportErrors;
  loading: boolean;
}

function emptyState(caseId: string | null): ReportsState {
  return {
    caseId,
    child: null,
    childError: null,
    reports: null,
    errors: {},
    loading: Boolean(caseId),
  };
}

/**
 * Everything the Reports pages show for one case: the child and the three
 * reports, loaded together, with one retry for both.
 *
 * When `caseId` changes, the previous case's child, reports and errors are
 * dropped straight away and `loading` is true again, so a page (or an
 * automatic print) can never show one case's report under another child.
 */
export function useParentReports(caseId: string | null) {
  const [state, setState] = useState<ReportsState>(() => emptyState(caseId));
  const [attempt, setAttempt] = useState(0);

  // State loaded for another case is never returned, not even for one render.
  const current = state.caseId === caseId ? state : emptyState(caseId);

  useEffect(() => {
    if (!caseId) return;

    let active = true;
    Promise.allSettled([
      loadReportChild(caseId),
      loadParentReports(caseId),
    ]).then(([child, reports]) => {
      if (!active) return;
      const failed = errorMessage(
        reports.status === "rejected" ? reports.reason : undefined,
      );
      setState({
        caseId,
        child: child.status === "fulfilled" ? child.value : null,
        childError:
          child.status === "rejected" ? errorMessage(child.reason) : null,
        reports:
          reports.status === "fulfilled"
            ? reports.value.reports
            : { screening: null, plan: null, recommendation: null },
        errors:
          reports.status === "fulfilled"
            ? reports.value.errors
            : { screening: failed, plan: failed, recommendation: failed },
        loading: false,
      });
    });
    return () => {
      active = false;
    };
  }, [caseId, attempt]);

  /** Load the child and all three reports again (shows loading meanwhile). */
  const retry = useCallback(() => {
    setState(emptyState(caseId));
    setAttempt((value) => value + 1);
  }, [caseId]);

  return { ...current, retry };
}
