import { aiApi, waitForJob, type WaitOptions } from "@/lib/ai";
import { ApiError, fetchAll, request } from "@/lib/api";
import { query } from "@/lib/query";
import type { PillTone } from "@/lib/format";

export type IEPStatus =
  "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";

export interface IEP {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: IEPStatus;
  generated_content: string;
  rag_file_references: string[];
  short_term_goals: string[];
  strategies: string[];
  generated_by: "MANUAL" | "AI";
  teacher_approved: boolean;
  teacher_approved_by: string | null;
  admin_approved: boolean;
  admin_approved_by: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  evaluation_unlock_date: string | null;
  created_by: string;
  created_at: string;
  superseded_at: string | null;
}

export type IEPFilters = {
  case_id?: string;
  status?: IEPStatus;
  limit?: number;
  offset?: number;
};

type ApproverRole = "TEACHER" | "ADMIN";

export const iepsApi = {
  list: (filters: IEPFilters = {}) => request<IEP[]>(`/ieps${query(filters)}`),
  activeForCase: (caseId: string) =>
    request<IEP>(`/ieps/case/${caseId}/active`),
  get: (iepId: string) => request<IEP>(`/ieps/${iepId}`),
  submit: (iepId: string) =>
    request<IEP>(`/ieps/${iepId}/submit`, { method: "POST" }),
  approve: (iepId: string, role: ApproverRole, approvedBy: string) =>
    request<IEP>(`/ieps/${iepId}/approve`, {
      method: "POST",
      body: JSON.stringify({ role, approved_by: approvedBy }),
    }),
  reject: (iepId: string, reason: string) =>
    request<IEP>(`/ieps/${iepId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export function plansForCase(caseId: string): Promise<IEP[]> {
  return fetchAll((limit, offset) =>
    iepsApi.list({ case_id: caseId, limit, offset }),
  );
}

export function currentIep(ieps: IEP[]): IEP | null {
  const live = ieps.filter((item) => item.status !== "SUPERSEDED");
  const pool = live.length > 0 ? live : ieps;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => b.version_number - a.version_number)[0];
}

export function evaluationIsOpen(iep: IEP, now = new Date()): boolean {
  if (iep.status !== "ACTIVE" || !iep.evaluation_unlock_date) return false;
  return new Date(iep.evaluation_unlock_date).getTime() <= now.getTime();
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksElapsed(iep: IEP, now = new Date()) {
  const total = 6;
  if (!iep.approved_at) return { week: 0, total };
  const passed = Math.floor(
    (now.getTime() - new Date(iep.approved_at).getTime()) / WEEK,
  );
  return { week: Math.min(total, Math.max(0, passed)), total };
}

export function planWeek(iep: IEP, now = new Date()): number {
  return Math.min(6, weeksElapsed(iep, now).week + 1);
}

export function planState(iep: IEP): {
  label: string;
  tone: PillTone;
  waitingForMe: boolean;
} {
  if (iep.status === "ACTIVE") {
    return evaluationIsOpen(iep)
      ? { label: "6-week check open", tone: "orange", waitingForMe: true }
      : {
          label: `Active · week ${planWeek(iep)} of 6`,
          tone: "sky",
          waitingForMe: false,
        };
  }
  if (iep.status === "REJECTED") {
    return {
      label: "New plan requested",
      tone: "outline",
      waitingForMe: false,
    };
  }
  if (iep.status === "SUPERSEDED") {
    return { label: "Replaced", tone: "grey", waitingForMe: false };
  }
  if (!iep.teacher_approved) {
    return { label: "Waiting for you", tone: "blush", waitingForMe: true };
  }
  return {
    label: "Waiting for the school",
    tone: "outline",
    waitingForMe: false,
  };
}

export interface ApprovalStep {
  label: string;
  done: boolean;
  current: boolean;
}

export function approvalSteps(iep: IEP): ApprovalStep[] {
  const done = [
    iep.status !== "DRAFT",
    iep.teacher_approved,
    iep.admin_approved,
    iep.status === "ACTIVE",
  ];
  const labels = [
    "Plan ready",
    "You approve",
    "School admin approves",
    "Active: download and follow it",
  ];
  const firstOpen = done.indexOf(false);
  return labels.map((label, i) => ({
    label,
    done: done[i],
    current: i === firstOpen,
  }));
}

export function canDownload(iep: IEP | null | undefined): boolean {
  return iep?.status === "ACTIVE";
}

export async function regeneratePlan(
  iep: IEP,
  prompt: string,
  options?: WaitOptions,
): Promise<IEP> {
  if (iep.status !== "REJECTED") {
    await iepsApi.reject(iep.iep_id, prompt.trim());
  }
  const job = await aiApi.startIep(iep.case_id);
  const done = await waitForJob(job.job_id, options);
  let next = done.result_id
    ? await iepsApi.get(done.result_id)
    : currentIep(await plansForCase(iep.case_id));
  if (!next || next.iep_id === iep.iep_id) {
    throw new ApiError(0, "The new plan was not found. Open this page again.");
  }
  if (next.status === "DRAFT") next = await iepsApi.submit(next.iep_id);
  return next;
}
