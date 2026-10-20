/**
 * Parent-portal API calls. Screens only talk to `parentApi`.
 *
 * Each function is a fromSource({ api, mock }):
 *   - api   real backend (default). A function whose backend endpoint does not
 *           exist yet returns pendingEndpoint(...) here, so the screen shows
 *           "not available yet" instead of pretending.
 *   - mock  ./mocks.ts, used only with NEXT_PUBLIC_USE_MOCKS=true.
 */
import { getStoredUser } from "@/features/auth";
import { fromSource } from "@/lib/data-source";
import { api, ApiError, saveBlob } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { pendingEndpoint } from "@/lib/pending";
import type {
  CaseRead,
  EvaluationQuestionRead,
  EvaluationResponseRead,
  IepRead,
  NotificationRead,
  ReportRead,
  UserRead,
} from "@/lib/api-types";
import {
  pickCase,
  ratingLabel,
  toChildSummary,
  toEvaluationQuestion,
  toReportCards,
} from "./adapters";
import { parentEndpoints as e } from "./endpoints";
import type {
  AnswerPayload,
  ChildSummary,
  EvaluationQuestion,
  QuestionnaireSession,
  ReportSummary,
  ScreeningQuestion,
  TeacherEvaluation,
} from "./types";

const mocks = () => import("./mocks");

// ── Shared real-API helpers ──────────────────────────────────────────────

/**
 * The cases that are about this parent's child.
 *
 * The backend has no parent -> child link in the API yet (no /students, and
 * GET /cases is not scoped to the caller). The one reliable link available is
 * the parent's own notifications, which carry a case_id; so "my child's cases"
 * are the cases named in my notifications. We deliberately do NOT fall back to
 * "all cases of the school": that could show (and let the parent answer for)
 * another family's child.
 * >>> When /students or a scoped /cases exists, replace the body of this function. <<<
 */
async function listMyCases(): Promise<CaseRead[]> {
  const notifications = await api.get<NotificationRead[]>(e.notifications, {
    params: { user_id: requireUserId(), limit: 200 },
  });
  const ids = [...new Set(notifications.map((n) => n.case_id).filter((id): id is string => Boolean(id)))];
  const cases = await Promise.all(
    ids.map((id) =>
      api.get<CaseRead>(e.case(id)).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null; // case was deleted
        throw error;
      }),
    ),
  );
  return cases.filter((c): c is CaseRead => c !== null);
}

/** The case + its active IEP, or a friendly error when the child has none yet. */
async function loadActiveIep(): Promise<{ found: CaseRead; iep: IepRead }> {
  const found = pickCase(await listMyCases(), ["EVALUATION_PENDING", "IEP_ACTIVE"]);
  if (!found) throw new ApiError("There is no evaluation for your child yet.", 404);
  try {
    const iep = await api.get<IepRead>(e.activeIepForCase(found.case_id));
    return { found, iep };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Your child's plan is not active yet, so there is no evaluation to complete.", 404);
    }
    throw error;
  }
}

function requireUserId(): string {
  const id = getStoredUser()?.id;
  if (!id) throw new ApiError("Please sign in again.", 401);
  return id;
}

/** question id -> id of the response already saved (so a changed answer is a PATCH, not a duplicate). */
let savedResponseIds: Record<string, string> = {};

// ── API ──────────────────────────────────────────────────────────────────
export const parentApi = {
  /**
   * Dashboard child card.
   * PENDING: name / date of birth / class / admission number need a /students
   * endpoint. Until then the card shows the status of the child's case.
   */
  child: (): Promise<ChildSummary> =>
    fromSource({
      api: async () => toChildSummary(pickCase(await listMyCases())),
      mock: async () => (await mocks()).mockChild,
    }),

  // ── Screening: PENDING (no screening endpoints in the backend yet) ─────
  startScreening: (): Promise<QuestionnaireSession<ScreeningQuestion, string>> =>
    fromSource({
      api: () => pendingEndpoint("The parent screening"),
      mock: async () => (await mocks()).mockScreeningSession(),
    }),

  saveScreeningAnswer: (sessionId: string, { questionId, answer }: AnswerPayload<string>): Promise<void> =>
    fromSource({
      api: () => pendingEndpoint("Saving screening answers"),
      mock: async () => (await mocks()).mockSaveAnswer(sessionId, questionId, answer),
    }),

  completeScreening: (sessionId: string): Promise<void> =>
    fromSource({
      api: () => pendingEndpoint("Finishing the screening"),
      mock: async () => (await mocks()).mockCompleteScreening(sessionId),
    }),

  // ── Evaluation: LIVE ───────────────────────────────────────────────────
  //   GET /cases -> GET /ieps/case/{id}/active -> GET /iep-evaluation-questions
  //   -> GET /iep-evaluation-responses (resume) -> POST / PATCH /iep-evaluation-responses
  startEvaluation: (): Promise<QuestionnaireSession<EvaluationQuestion, number>> =>
    fromSource({
      api: async () => {
        const userId = requireUserId();
        const { iep } = await loadActiveIep();
        if (iep.evaluation_unlock_date && new Date(iep.evaluation_unlock_date) > new Date()) {
          throw new ApiError(`Your evaluation opens on ${formatDate(iep.evaluation_unlock_date)}.`, 403);
        }

        const [questions, responses] = await Promise.all([
          api.get<EvaluationQuestionRead[]>(e.evaluationQuestions, {
            params: { iep_id: iep.iep_id, limit: 200 },
          }),
          api.get<EvaluationResponseRead[]>(e.evaluationResponses, {
            params: { responder_id: userId, responder_role: "PARENT", limit: 200 },
          }),
        ]);

        const sorted = [...questions].sort((a, b) => a.position - b.position);
        const ids = new Set(sorted.map((q) => q.eval_question_id));
        savedResponseIds = {};
        const answers: Record<string, number> = {};
        for (const response of responses) {
          if (!ids.has(response.eval_question_id)) continue; // an answer to another IEP's question
          savedResponseIds[response.eval_question_id] = response.eval_response_id;
          answers[response.eval_question_id] = response.score;
        }
        return { sessionId: iep.iep_id, questions: sorted.map(toEvaluationQuestion), answers };
      },
      mock: async () => (await mocks()).mockEvaluationSession(),
    }),

  /** Called for every answered question when the parent presses Next. */
  saveEvaluationAnswer: (iepId: string, { questionId, answer }: AnswerPayload<number>): Promise<void> =>
    fromSource({
      api: async () => {
        const existing = savedResponseIds[questionId];
        if (existing) {
          await api.patch(e.evaluationResponse(existing), { score: answer });
          return;
        }
        const created = await api.post<EvaluationResponseRead>(e.evaluationResponses, {
          eval_question_id: questionId,
          responder_id: requireUserId(),
          responder_role: "PARENT",
          score: answer,
        });
        savedResponseIds[questionId] = created.eval_response_id;
      },
      mock: async () => (await mocks()).mockSaveAnswer(iepId, questionId, answer),
    }),

  /**
   * Called when the parent confirms the submission. Every answer is already
   * saved, and the backend has no "submit evaluation" endpoint, so there is
   * nothing more to send. If one is added, call it here.
   */
  completeEvaluation: (_iepId: string): Promise<void> =>
    fromSource({ api: async () => undefined, mock: () => undefined }),

  // ── Reports: LIVE for the report itself, PENDING for the PDF ───────────
  reports: (): Promise<ReportSummary[]> =>
    fromSource({
      api: async () => {
        const found = pickCase(await listMyCases());
        if (!found) return toReportCards(null, undefined);
        try {
          return toReportCards(await api.get<ReportRead>(e.reportForCase(found.case_id)), found);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return toReportCards(null, found);
          throw error;
        }
      },
      mock: async () => (await mocks()).mockReports,
    }),

  downloadReport: (report: ReportSummary): Promise<void> =>
    fromSource({
      api: () => pendingEndpoint("Downloading the report as a PDF"),
      mock: async () => {
        const m = await mocks();
        saveBlob(m.mockPdf(report.title), `${report.type}-report.pdf`);
      },
    }),

  // ── Teacher's evaluation ("School" tab): LIVE (teacher's ratings) ──────
  teacherEvaluation: (): Promise<TeacherEvaluation> =>
    fromSource({
      api: async () => {
        const { found, iep } = await loadActiveIep();
        const [questions, responses] = await Promise.all([
          api.get<EvaluationQuestionRead[]>(e.evaluationQuestions, {
            params: { iep_id: iep.iep_id, limit: 200 },
          }),
          api.get<EvaluationResponseRead[]>(e.evaluationResponses, {
            params: { responder_role: "TEACHER", limit: 200 },
          }),
        ]);
        const sorted = [...questions].sort((a, b) => a.position - b.position);
        const byQuestion = new Map(responses.map((r) => [r.eval_question_id, r]));
        const rated = sorted.filter((q) => byQuestion.has(q.eval_question_id));
        const teacherId = byQuestion.get(rated[0]?.eval_question_id)?.responder_id ?? found.initiated_by;
        const latest = rated
          .map((q) => byQuestion.get(q.eval_question_id)!.submitted_at)
          .sort()
          .pop();

        // The teacher's contact details: parents may not be allowed to read /users/{id}.
        // Then the card simply says "Not provided" (the design has no error state there).
        const teacher = await api.get<UserRead>(e.user(teacherId)).catch(() => null);
        const name = teacher ? `${teacher.first_name} ${teacher.last_name}`.trim() : null;

        return {
          evaluatedBy: "Evaluation by teacher",
          teacherName: name,
          date: formatDate(latest),
          details: rated.map((q) => ({
            question: q.question_text,
            rating: ratingLabel(byQuestion.get(q.eval_question_id)!.score),
          })),
          teacher: { name, phone: teacher?.phone ?? null, email: teacher?.email ?? null },
        };
      },
      mock: async () => (await mocks()).mockTeacherEvaluation,
    }),

  downloadTeacherEvaluation: (): Promise<void> =>
    fromSource({
      api: () => pendingEndpoint("Downloading the teacher's evaluation as a PDF"),
      mock: async () => {
        const m = await mocks();
        saveBlob(m.mockPdf("Teacher evaluation"), "teacher-evaluation.pdf");
      },
    }),
};
