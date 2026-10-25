import { request } from "@/lib/api";
import type { Classroom } from "@/lib/classroom";
import type { EvaluationRound } from "@/lib/evaluations";
import {
  hasUnavailable,
  parentEvaluationUpdates,
  roundUpdates,
  sortUpdates,
  teacherEvaluationUpdates,
} from "@/lib/evaluation-updates";
import { makeCase, makeStudent } from "@/tests/helpers";
import { makeIep } from "@/tests/iep-helpers";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

const NOW = new Date("2026-10-24T09:00:00Z");

function round(overrides: Partial<EvaluationRound> = {}): EvaluationRound {
  return {
    iep_id: "p1",
    status: "OPEN",
    opens_at: "2026-10-13T00:00:00Z",
    locked_until: null,
    last_submitted_at: null,
    questions: [],
    my_responses: [],
    ...overrides,
  };
}

const common = {
  other: null,
  role: "TEACHER" as const,
  name: "Amina",
  checkHref: "/check",
  reportHref: "/report",
  now: NOW,
};

describe("roundUpdates", () => {
  it("an open check is a to-do", () => {
    const [item] = roundUpdates({ ...common, round: round() });
    expect(item.urgent).toBe(true);
    expect(item.text).toContain("open");
    expect(item.href).toBe("/check");
  });

  it("locked answers say when the next check opens", () => {
    const [item] = roundUpdates({
      ...common,
      round: round({
        status: "LOCKED",
        locked_until: "2026-12-01T00:00:00Z",
        last_submitted_at: "2026-10-20T00:00:00Z",
      }),
    });
    expect(item.text).toContain("1 Dec 2026");
    expect(item.text).toContain("38 days left");
    expect(item.urgent).toBeFalsy();
  });

  it("mentions a check opening soon, but not one months away", () => {
    const soon = roundUpdates({
      ...common,
      round: round({ status: "NOT_OPEN", opens_at: "2026-10-30T00:00:00Z" }),
    });
    const far = roundUpdates({
      ...common,
      round: round({ status: "NOT_OPEN", opens_at: "2027-01-30T00:00:00Z" }),
    });
    expect(soon).toHaveLength(1);
    expect(far).toHaveLength(0);
  });

  it("tells the parent when the teacher's evaluation arrives", () => {
    const items = roundUpdates({
      ...common,
      role: "PARENT",
      round: round({ status: "NOT_APPROVED" }),
      other: {
        eval_response_id: "r1",
        eval_question_id: "q1",
        responder_id: "t1",
        responder_role: "TEACHER",
        score: 1,
        submitted_at: "2026-10-22T08:00:00Z",
      },
    });
    expect(items).toHaveLength(1);
    expect(items[0].text).toContain("School");
    expect(items[0].date).toBe("2026-10-22T08:00:00Z");
  });
});

describe("sortUpdates", () => {
  it("puts things to do first, then the newest", () => {
    const sorted = sortUpdates([
      { id: "old", text: "", date: "2026-10-01T00:00:00Z" },
      { id: "todo", text: "", date: "2026-09-01T00:00:00Z", urgent: true },
      { id: "new", text: "", date: "2026-10-20T00:00:00Z" },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["todo", "new", "old"]);
  });
});

describe("when the 6-week check cannot be loaded", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockRejectedValue(new Error("Down"));
  });

  it("tells the parent instead of hiding the reminder", async () => {
    const items = await parentEvaluationUpdates(
      makeStudent(),
      makeIep({ status: "ACTIVE" }),
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0].unavailable).toBe(true);
    expect(items[0].text).toContain("could not load");
    expect(items[0].href).toBe("/parent/evaluation");
    expect(hasUnavailable(items)).toBe(true);
  });

  it("tells the teacher which student it is about", async () => {
    const student = makeStudent();
    const caseItem = makeCase({ case_id: "c1" });
    const room: Classroom = {
      students: [student],
      cases: [caseItem],
      caseByStudent: new Map([[student.student_id, caseItem]]),
      iepByCase: new Map([["c1", makeIep({ status: "ACTIVE" })]]),
    };
    const items = await teacherEvaluationUpdates(room, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].unavailable).toBe(true);
    expect(items[0].text).toContain("Amani Otieno");
    expect(items[0].href).toBe("/teacher/cases/c1/check");
  });

  it("has nothing to report when every check loaded", () => {
    expect(hasUnavailable([])).toBe(false);
  });
});
