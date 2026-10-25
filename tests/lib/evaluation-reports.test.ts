import { request } from "@/lib/api";
import {
  loadEvaluationReports,
  overallLabel,
  reportsThisYear,
  topReports,
  type EvaluationReport,
} from "@/lib/evaluation-reports";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

const PLANS = [
  {
    iep_id: "p1",
    case_id: "c1",
    version_number: 1,
    approved_at: "2026-03-01T00:00:00Z",
  },
  { iep_id: "p2", case_id: "c1", version_number: 2, approved_at: null },
];

function answer(q: string, role: string, score: number, at: string) {
  return {
    eval_response_id: `${q}-${role}`,
    eval_question_id: q,
    responder_id: role === "TEACHER" ? "t1" : "u1",
    responder_role: role,
    score,
    submitted_at: at,
  };
}

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockImplementation(async (path: string) => {
    if (path.startsWith("/ieps")) return PLANS;
    if (path.startsWith("/iep-evaluation-questions")) {
      return [2, 1].map((n) => ({
        eval_question_id: `q${n}`,
        iep_id: "p1",
        position: n,
        question_text: `Question ${n}?`,
        created_at: "2026-03-01T00:00:00Z",
      }));
    }
    const q = new URLSearchParams(path.split("?")[1]).get("eval_question_id");
    return [
      answer(q!, "TEACHER", 1, "2026-04-15T10:00:00Z"),
      answer(q!, "PARENT", q === "q1" ? 2 : 1, "2026-04-20T10:00:00Z"),
    ];
  });
});

describe("loadEvaluationReports", () => {
  it("builds one report per person per approved plan", async () => {
    const reports = await loadEvaluationReports(["c1"]);
    expect(reports.map((r) => r.id)).toEqual(["p1:PARENT", "p1:TEACHER"]);
    const parent = reports[0];
    expect(parent.answers.map((a) => a.question.position)).toEqual([1, 2]);
    expect(parent.answers.map((a) => a.score)).toEqual([2, 1]);
    expect(parent.average).toBe(1.5);
    expect(parent.submittedAt).toBe("2026-04-20T10:00:00Z");
  });

  it("skips plans that were never approved", async () => {
    await loadEvaluationReports(["c1"]);
    const asked = mockRequest.mock.calls.map(([path]) => path as string);
    expect(asked.some((p) => p.includes("iep_id=p2"))).toBe(false);
  });
});

function report(
  id: string,
  submittedAt: string,
  average = 0,
): EvaluationReport {
  return {
    id,
    iepId: id,
    caseId: "c1",
    planVersion: 1,
    planApprovedAt: null,
    role: "PARENT",
    responderId: "u1",
    submittedAt,
    answers: [],
    average,
  };
}

describe("top five and the year", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  const reports = [
    report("a", "2026-10-01T00:00:00Z"),
    report("b", "2026-08-01T00:00:00Z"),
    report("c", "2026-06-01T00:00:00Z"),
    report("d", "2026-04-01T00:00:00Z"),
    report("e", "2026-02-01T00:00:00Z"),
    report("f", "2025-12-01T00:00:00Z"),
    report("g", "2025-06-01T00:00:00Z"),
  ];

  it("shows the five newest first", () => {
    expect(topReports(reports).map((r) => r.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("View all lists the past 12 months", () => {
    expect(reportsThisYear(reports, now).map((r) => r.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });

  it("says the overall answer in words", () => {
    const some = report("x", "2026-01-01", 1.4);
    expect(overallLabel(some)).toBe("A little better");
    expect(overallLabel({ ...some, average: null })).toBe("—");
  });
});
