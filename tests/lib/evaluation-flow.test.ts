import { request } from "@/lib/api";
import {
  checkStates,
  evaluatedIep,
  lockCountdown,
  planForCase,
  submitEvaluation,
  unavailableCount,
  withCheckState,
} from "@/lib/evaluation-flow";
import type { EvaluationQuestion } from "@/lib/evaluations";
import type { IEP } from "@/lib/ieps";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

function plan(overrides: Partial<IEP> = {}): IEP {
  return {
    iep_id: "p1",
    case_id: "c1",
    version_number: 1,
    status: "ACTIVE",
    generated_content: "",
    rag_file_references: [],
    short_term_goals: [],
    strategies: [],
    generated_by: "AI",
    teacher_approved: true,
    teacher_approved_by: "t1",
    admin_approved: true,
    admin_approved_by: "a1",
    rejection_reason: null,
    approved_at: "2026-09-01T00:00:00Z",
    evaluation_unlock_date: "2026-10-13T00:00:00Z",
    created_by: "t1",
    created_at: "2026-08-20T00:00:00Z",
    superseded_at: null,
    ...overrides,
  };
}

const questions: EvaluationQuestion[] = [1, 2].map((n) => ({
  eval_question_id: `q${n}`,
  iep_id: "p1",
  position: n,
  question_text: `Question ${n}?`,
  created_at: "2026-09-01T00:00:00Z",
}));

const round = {
  iep_id: "p1",
  status: "LOCKED",
  opens_at: null,
  locked_until: "2026-12-01T00:00:00Z",
  last_submitted_at: "2026-10-20T00:00:00Z",
  questions,
  my_responses: [],
};

beforeEach(() => mockRequest.mockReset());

describe("evaluatedIep", () => {
  it("evaluates the active plan, not a newer draft", () => {
    const chosen = evaluatedIep([
      plan({ iep_id: "old", version_number: 1, status: "ACTIVE" }),
      plan({ iep_id: "new", version_number: 2, status: "DRAFT" }),
    ]);
    expect(chosen?.iep_id).toBe("old");
  });

  it("falls back to the newest live plan", () => {
    const chosen = evaluatedIep([
      plan({ iep_id: "a", version_number: 1, status: "SUPERSEDED" }),
      plan({ iep_id: "b", version_number: 2, status: "PENDING_APPROVAL" }),
    ]);
    expect(chosen?.iep_id).toBe("b");
  });
});

describe("lockCountdown", () => {
  it("counts the days until the next check", () => {
    const now = new Date("2026-10-31T00:00:00Z");
    expect(lockCountdown("2026-12-01T00:00:00Z", now)).toEqual({
      daysLeft: 31,
      elapsedDays: 11,
      totalDays: 42,
    });
  });
});

describe("submitEvaluation", () => {
  it("sends every answer in one request", async () => {
    mockRequest.mockResolvedValue(round);
    await submitEvaluation({
      iep: plan(),
      questions,
      answers: { q1: 2, q2: -1 },
      role: "PARENT",
    });
    expect(mockRequest.mock.calls).toHaveLength(1);
    const [path, options] = mockRequest.mock.calls[0];
    expect(path).toBe("/iep-evaluation-responses/submit");
    expect(JSON.parse(options.body)).toEqual({
      iep_id: "p1",
      answers: [
        { eval_question_id: "q1", score: 2 },
        { eval_question_id: "q2", score: -1 },
      ],
    });
  });

  it("a parent never changes the case", async () => {
    mockRequest.mockResolvedValue(round);
    const result = await submitEvaluation({
      iep: plan(),
      questions,
      answers: { q1: 1, q2: 1 },
      role: "PARENT",
    });
    expect(result.caseUpdate).toEqual({
      ok: true,
      bothDone: false,
      changed: false,
    });
    expect(mockRequest.mock.calls.some(([p]) => p.startsWith("/cases"))).toBe(
      false,
    );
  });

  it("completes the case when the parent has answered too", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/iep-evaluation-responses/submit")) return round;
      if (path.startsWith("/iep-evaluation-responses")) return [{ score: 1 }];
      if (path === "/cases/c1") return { status: "EVALUATION_PENDING" };
      return {};
    });
    const result = await submitEvaluation({
      iep: plan(),
      questions,
      answers: { q1: 1, q2: 1 },
      role: "TEACHER",
    });
    expect(result.caseUpdate).toEqual({
      ok: true,
      bothDone: true,
      changed: true,
    });
    const patch = mockRequest.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(JSON.parse(patch[1].body)).toEqual({ status: "COMPLETED" });
  });

  it("reports a failed case update instead of hiding it", async () => {
    const { ApiError } = jest.requireActual("@/lib/api");
    mockRequest.mockImplementation(
      async (path: string, options?: RequestInit) => {
        if (path.startsWith("/iep-evaluation-responses/submit")) return round;
        if (path.startsWith("/iep-evaluation-responses")) return [];
        if (options?.method === "PATCH") throw new ApiError(500, "Down");
        return { status: "IEP_ACTIVE" };
      },
    );
    const result = await submitEvaluation({
      iep: plan(),
      questions,
      answers: { q1: 1, q2: 1 },
      role: "TEACHER",
    });
    expect(result.round.status).toBe("LOCKED");
    expect(result.caseUpdate).toEqual({ ok: false, message: "Down" });
  });

  it("throws, saving nothing, when the answers cannot be sent", async () => {
    mockRequest.mockRejectedValue(new Error("offline"));
    await expect(
      submitEvaluation({
        iep: plan(),
        questions,
        answers: { q1: 1, q2: 1 },
        role: "TEACHER",
      }),
    ).rejects.toThrow("offline");
  });
});

describe("withCheckState", () => {
  const base = {
    label: "6-week check open",
    tone: "orange" as const,
    needsAction: true,
    activePlan: true,
  };

  it("shows that sent answers need nothing more", () => {
    expect(withCheckState(base, "LOCKED")).toMatchObject({
      label: "Answers sent",
      needsAction: false,
    });
  });

  it("keeps the status when the state is unknown", () => {
    expect(withCheckState(base, undefined)).toBe(base);
  });
});

describe("planForCase", () => {
  it("finds an active plan beyond the first page", async () => {
    const drafts = Array.from({ length: 200 }, (_, i) =>
      plan({ iep_id: `d${i}`, version_number: i + 2, status: "SUPERSEDED" }),
    );
    mockRequest.mockImplementation(async (path: string) =>
      path.includes("offset=200")
        ? [plan({ iep_id: "active", version_number: 1, status: "ACTIVE" })]
        : drafts,
    );
    const chosen = await planForCase("c1");
    expect(chosen?.iep_id).toBe("active");
    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(mockRequest.mock.calls[1][0]).toMatch(/offset=200/);
  });
});

describe("checkStates", () => {
  it("marks a state that failed to load as unavailable", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.includes("iep_id=bad")) throw new Error("Down");
      return { ...round, status: "OPEN" };
    });
    const states = await checkStates(["good", "bad"]);
    expect(states.get("good")).toBe("OPEN");
    expect(states.get("bad")).toBe("UNAVAILABLE");
    expect(unavailableCount(states)).toBe(1);
  });

  it("counts nothing before the states have loaded", () => {
    expect(unavailableCount(null)).toBe(0);
  });
});

describe("withCheckState when the state is unavailable", () => {
  it("says so instead of guessing from the plan dates", () => {
    const base = {
      label: "6-week check open",
      tone: "orange" as const,
      needsAction: true,
      activePlan: true,
    };
    expect(withCheckState(base, "UNAVAILABLE")).toMatchObject({
      label: "Check status unavailable",
      needsAction: false,
      activePlan: true,
    });
  });
});
