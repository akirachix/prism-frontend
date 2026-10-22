import { request } from "@/lib/api";
import { saveAnswers, scaleLabel, type EvaluationResponse } from "@/lib/evaluations";

jest.mock("@/lib/api", () => ({ request: jest.fn(), query: jest.requireActual("@/lib/api").query }));

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
