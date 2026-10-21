import { request } from "@/lib/api";
import {
  evaluationIsOpen,
  weeksElapsed,
  type IEP,
} from "@/lib/evaluation-flow";
import {
  saveAnswers,
  scaleLabel,
  type EvaluationResponse,
} from "@/lib/evaluation";

jest.mock("@/lib/api", () => ({
  request: jest.fn(),
  query: jest.requireActual("@/lib/api").query,
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

const previous: EvaluationResponse = {
  eval_response_id: "r1",
  eval_question_id: "q1",
  responder_id: "t1",
  responder_role: "TEACHER",
  score: 0,
  submitted_at: "",
};

describe("saveAnswers", () => {
  it("creates new answers and updates changed ones", async () => {
    await saveAnswers({ q1: 2, q2: -1 }, [previous], "t1", "TEACHER");
    expect(mockRequest).toHaveBeenCalledWith("/iep-evaluation-responses/r1", {
      method: "PATCH",
      body: JSON.stringify({ score: 2 }),
    });
    expect(mockRequest).toHaveBeenCalledWith("/iep-evaluation-responses", {
      method: "POST",
      body: JSON.stringify({
        eval_question_id: "q2",
        responder_id: "t1",
        responder_role: "TEACHER",
        score: -1,
      }),
    });
  });

  it("skips answers that did not change", async () => {
    await saveAnswers({ q1: 0 }, [previous], "t1", "TEACHER");
    expect(mockRequest).not.toHaveBeenCalled();
  });
});

describe("scaleLabel", () => {
  it("names each face", () => {
    expect(scaleLabel(1)).toBe("A little better");
    expect(scaleLabel(-2)).toBe("Much worse");
  });
});

describe("plan timing", () => {
  const plan: IEP = {
    iep_id: "i1",
    case_id: "c1",
    version_number: 1,
    status: "ACTIVE",
    approved_at: "2026-09-01T00:00:00Z",
    evaluation_unlock_date: "2026-10-13T00:00:00Z",
  };

  it("opens the check on the unlock date", () => {
    expect(evaluationIsOpen(plan, new Date("2026-10-14"))).toBe(true);
    expect(evaluationIsOpen(plan, new Date("2026-10-01"))).toBe(false);
  });

  it("counts weeks since approval", () => {
    expect(weeksElapsed(plan, new Date("2026-09-16T00:00:00Z"))).toEqual({
      week: 2,
      total: 6,
    });
  });
});
