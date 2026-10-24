import { request } from "@/lib/api";

/** A background AI job (POST /ai/... returns one; poll GET /ai/jobs/{id}). */
export interface AIJob {
  job_id: string;
  case_id: string;
  kind: string;
  status: string;
  result_id: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export const aiApi = {
  /** Ask the AI for a new plan for the case. */
  startIep: (caseId: string) =>
    request<AIJob>(`/ai/cases/${caseId}/iep`, { method: "POST" }),
  job: (jobId: string) => request<AIJob>(`/ai/jobs/${jobId}`),
};

const FAILED = ["FAILED", "ERROR", "CANCELLED", "CANCELED"];

export function jobSucceeded(job: AIJob): boolean {
  return job.status.toUpperCase() === "SUCCEEDED";
}

export function jobFailed(job: AIJob): boolean {
  return FAILED.includes(job.status.toUpperCase());
}

export interface WaitOptions {
  intervalMs?: number;
  timeoutMs?: number;
  /** Replaced in tests so they do not really wait. */
  sleep?: (ms: number) => Promise<void>;
}

const pause = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * Poll a job until it succeeds. Throws with a message the teacher can read
 * when it fails or takes too long.
 */
export async function waitForJob(
  jobId: string,
  { intervalMs = 3000, timeoutMs = 180000, sleep = pause }: WaitOptions = {},
): Promise<AIJob> {
  for (let waited = 0; ; waited += intervalMs) {
    const job = await aiApi.job(jobId);
    if (jobSucceeded(job)) return job;
    if (jobFailed(job)) {
      throw new Error(
        job.error
          ? `The AI could not write the plan: ${job.error}`
          : "The AI could not write the plan. Please try again.",
      );
    }
    if (waited >= timeoutMs) {
      throw new Error(
        "The new plan is taking longer than usual. Open this page again in a few minutes.",
      );
    }
    await sleep(intervalMs);
  }
}
