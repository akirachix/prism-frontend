import { ApiError, request } from "@/lib/api";
import {
  anchorQuestions,
  areaTitle,
  loadPlanned,
  partsFromPlan,
  saveScreening,
  scoreIfWaitIsOver,
  screeningApi,
  screeningIsOpen,
  screeningOutcome,
  soloScoringDate,
  stageFor,
  stepOf,
  type Assessment,
  type AssessmentPlan,
  type MyScreening,
  type ScreeningQuestion,
} from "@/lib/screening";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

function question(
  tool: ScreeningQuestion["tool_type"],
  n: number,
  active = true,
): ScreeningQuestion {
  return {
    question_id: `${tool}-${n}`,
    tool_type: tool,
    target_neurodivergence: "X",
    question_number: n,
    question_text: `Question ${n}`,
    answer_scale: 4,
    answer_labels: ["Never", "Sometimes", "Often", "Very often"],
    is_scored: true,
    reverse_scored: false,
    subscale: null,
    is_text_verified: true,
    is_active: active,
    created_at: "",
  };
}

function assessment(
  role: "TEACHER" | "PARENT",
  completed: string | null,
): Assessment {
  return {
    assessment_id: `a-${role}`,
    case_id: "c1",
    responder_id: `u-${role}`,
    responder_role: role,
    started_at: "2026-10-01T00:00:00Z",
    completed_at: completed,
  };
}

function plan(overrides: Partial<AssessmentPlan> = {}): AssessmentPlan {
  return {
    assessment_id: "a-TEACHER",
    case_id: "c1",
    responder_role: "TEACHER",
    stage: "ANCHORS",
    anchor_question_ids: ["ANCHOR-1", "ANCHOR-2", "ANCHOR-3"],
    sections: [],
    unavailable_tools: [],
    answered: 0,
    total: 3,
    ...overrides,
  };
}

const bank = new Map(
  [
    question("ANCHOR", 1),
    question("ANCHOR", 2),
    question("ANCHOR", 3),
    question("SNAP_IV", 1),
    question("SNAP_IV", 2),
    question("CLDQR", 1),
  ].map((q) => [q.question_id, q]),
);

describe("anchorQuestions and partsFromPlan", () => {
  it("returns the anchors in the plan's order", () => {
    const anchors = anchorQuestions(
      plan({ anchor_question_ids: ["ANCHOR-3", "ANCHOR-1"] }),
      bank,
    );
    expect(anchors.map((q) => q.question_id)).toEqual(["ANCHOR-3", "ANCHOR-1"]);
  });

  it("builds only the planned parts, named in plain words", () => {
    const parts = partsFromPlan(
      plan({
        sections: [
          {
            tool_type: "SNAP_IV",
            domain: "ADHD",
            question_ids: ["SNAP_IV-2", "SNAP_IV-1"],
            answered: 0,
            total: 2,
          },
          {
            tool_type: "CLDQR",
            domain: "DYSLEXIA",
            question_ids: ["CLDQR-1"],
            answered: 0,
            total: 1,
          },
        ],
      }),
      bank,
    );
    expect(parts.map((p) => p.title)).toEqual([
      "Attention and activity",
      "Reading and spelling",
    ]);
    expect(parts[0].questions.map((q) => q.question_id)).toEqual([
      "SNAP_IV-2",
      "SNAP_IV-1",
    ]);
  });

  it("names a section from its tool when the domain is missing", () => {
    expect(areaTitle({ tool_type: "CAST", domain: "" })).toBe(
      "Social communication and play",
    );
  });
});

describe("stepOf", () => {
  const base: MyScreening = {
    assessment: assessment("TEACHER", null),
    plan: plan(),
    waitingForTeacher: false,
    questions: bank,
    answers: {},
  };
  const allAnchors = { "ANCHOR-1": 0, "ANCHOR-2": 1, "ANCHOR-3": 0 };
  const withSections = plan({
    sections: [
      {
        tool_type: "SNAP_IV",
        domain: "ADHD",
        question_ids: ["SNAP_IV-1"],
        answered: 0,
        total: 1,
      },
    ],
  });

  it("starts before there is an assessment", () => {
    expect(stepOf({ ...base, assessment: null, plan: null })).toBe("start");
  });

  it("asks the anchors first", () => {
    expect(stepOf({ ...base, answers: { "ANCHOR-1": 0 } })).toBe("anchors");
  });

  it("goes on to the planned questions once the anchors are answered", () => {
    expect(stepOf({ ...base, plan: withSections, answers: allAnchors })).toBe(
      "questions",
    );
  });

  it("never makes the teacher wait", () => {
    expect(
      stepOf({
        ...base,
        plan: withSections,
        answers: allAnchors,
        waitingForTeacher: true,
      }),
    ).toBe("questions");
  });

  it("never asks the parent the anchors", () => {
    expect(
      stepOf({
        ...base,
        assessment: assessment("PARENT", null),
        plan: withSections,
      }),
    ).toBe("questions");
  });

  it("makes the parent wait until the teacher has answered the anchors", () => {
    expect(
      stepOf({
        ...base,
        assessment: assessment("PARENT", null),
        waitingForTeacher: true,
      }),
    ).toBe("waiting");
  });

  it("is done once the assessment is completed", () => {
    expect(
      stepOf({ ...base, assessment: assessment("TEACHER", "2026-10-02") }),
    ).toBe("done");
  });
});

describe("loadPlanned", () => {
  it("reads the plan, progress, answers and every question it needs", async () => {
    const extra = question("ANCHOR", 9, false);
    mockRequest.mockImplementation(async (path: string) => {
      if (path === "/screening-assessments/a-TEACHER/plan") {
        return plan({ anchor_question_ids: ["ANCHOR-1", "ANCHOR-9"] });
      }
      if (path === "/screening-assessments/a-TEACHER/progress") {
        return { waiting_for_teacher: true };
      }
      if (path.startsWith("/screening-responses")) {
        return [{ question_id: "ANCHOR-1", selected_value: 2 }];
      }
      if (path.startsWith("/screening-questions?")) return [...bank.values()];
      if (path === "/screening-questions/ANCHOR-9") return extra;
      throw new Error(`unexpected ${path}`);
    });

    const loaded = await loadPlanned(assessment("TEACHER", null));
    expect(loaded.answers).toEqual({ "ANCHOR-1": 2 });
    expect(loaded.waitingForTeacher).toBe(true);
    expect(loaded.questions.get("ANCHOR-9")).toEqual(extra);
  });
});

describe("screeningApi", () => {
  it("saves a part's answers in one bulk request", async () => {
    await screeningApi.saveAnswers("a1", { q1: 2, q2: 0 });
    expect(mockRequest).toHaveBeenCalledWith("/screening-responses/bulk", {
      method: "PUT",
      body: JSON.stringify({
        assessment_id: "a1",
        answers: [
          { question_id: "q1", selected_value: 2 },
          { question_id: "q2", selected_value: 0 },
        ],
      }),
    });
  });

  it("asks only for active questions", async () => {
    mockRequest.mockResolvedValue([]);
    await screeningApi.questions();
    expect(mockRequest).toHaveBeenCalledWith(
      "/screening-questions?is_active=true&limit=200&offset=0",
    );
  });
});

describe("saveScreening", () => {
  it("creates the assessment on first save and does not finish", async () => {
    mockRequest.mockImplementation(async (path: string) =>
      path === "/screening-assessments"
        ? assessment("TEACHER", null)
        : { saved: 1 },
    );
    const result = await saveScreening({
      caseId: "c1",
      role: "TEACHER",
      responderId: "u-TEACHER",
      assessment: null,
      answers: { q1: 1 },
      finish: false,
    });
    expect(result.score).toBeNull();
    expect(mockRequest).toHaveBeenCalledWith("/screening-assessments", {
      method: "POST",
      body: JSON.stringify({
        case_id: "c1",
        responder_id: "u-TEACHER",
        responder_role: "TEACHER",
      }),
    });
    expect(mockRequest).not.toHaveBeenCalledWith(
      "/screening-assessments/a-TEACHER/complete",
      {
        method: "POST",
      },
    );
  });

  it("scores the case when the other person has already finished", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.endsWith("/complete"))
        return assessment("PARENT", "2026-10-02T00:00:00Z");
      if (path.startsWith("/screening-assessments?")) {
        return [
          assessment("TEACHER", "2026-10-01T00:00:00Z"),
          assessment("PARENT", "2026-10-02T00:00:00Z"),
        ];
      }
      if (path.endsWith("/calculate"))
        return { status: "NO_CONCERN_IDENTIFIED" };
      return { saved: 1 };
    });
    const result = await saveScreening({
      caseId: "c1",
      role: "PARENT",
      responderId: "u-PARENT",
      assessment: assessment("PARENT", null),
      answers: { q1: 3 },
      finish: true,
    });
    expect(mockRequest).toHaveBeenCalledWith(
      "/domain-scores/case/c1/calculate",
      { method: "POST" },
    );
    expect(result.score).toEqual({ status: "NO_CONCERN_IDENTIFIED" });
  });

  it("waits when the other person has not finished", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.endsWith("/complete"))
        return assessment("TEACHER", "2026-10-01T00:00:00Z");
      if (path.startsWith("/screening-assessments?")) {
        return [
          assessment("TEACHER", "2026-10-01T00:00:00Z"),
          assessment("PARENT", null),
        ];
      }
      return { saved: 1 };
    });
    const result = await saveScreening({
      caseId: "c1",
      role: "TEACHER",
      responderId: "u-TEACHER",
      assessment: assessment("TEACHER", null),
      answers: { q1: 0 },
      finish: true,
    });
    expect(result.score).toBeNull();
    expect(mockRequest).not.toHaveBeenCalledWith(
      "/domain-scores/case/c1/calculate",
      { method: "POST" },
    );
  });

  it("reuses the assessment if another tab created it first", async () => {
    mockRequest.mockImplementation(
      async (path: string, init?: { method?: string }) => {
        if (path === "/screening-assessments" && init?.method === "POST") {
          throw new ApiError(
            409,
            "This case already has an assessment for that respondent role.",
          );
        }
        if (path.startsWith("/screening-assessments?"))
          return [assessment("TEACHER", null)];
        return { saved: 1 };
      },
    );
    const result = await saveScreening({
      caseId: "c1",
      role: "TEACHER",
      responderId: "u-TEACHER",
      assessment: null,
      answers: { q1: 1 },
      finish: false,
    });
    expect(result.assessment.assessment_id).toBe("a-TEACHER");
  });
});

describe("stages and the 7-day wait", () => {
  it("works out where one person is", () => {
    expect(stageFor([], "PARENT")).toBe("not_started");
    expect(stageFor([assessment("PARENT", null)], "PARENT")).toBe(
      "in_progress",
    );
    expect(
      stageFor([assessment("PARENT", "2026-10-01T00:00:00Z")], "PARENT"),
    ).toBe("waiting_for_other");
    expect(
      stageFor(
        [
          assessment("PARENT", "2026-10-01T00:00:00Z"),
          assessment("TEACHER", "2026-10-02T00:00:00Z"),
        ],
        "PARENT",
      ),
    ).toBe("both_done");
  });

  it("scores one person alone 7 days after they finished", () => {
    const due = soloScoringDate([
      assessment("TEACHER", "2026-10-01T00:00:00Z"),
      assessment("PARENT", null),
    ]);
    expect(due?.toISOString()).toBe("2026-10-08T00:00:00.000Z");
    expect(soloScoringDate([])).toBeNull();
  });

  it("asks the backend to score only once the wait is over", async () => {
    const one = [assessment("TEACHER", "2026-10-01T00:00:00Z")];
    await scoreIfWaitIsOver("c1", one, null, new Date("2026-10-05T00:00:00Z"));
    expect(mockRequest).not.toHaveBeenCalled();
    mockRequest.mockResolvedValue({ status: "NO_CONCERN_IDENTIFIED" });
    await expect(
      scoreIfWaitIsOver("c1", one, null, new Date("2026-10-09T00:00:00Z")),
    ).resolves.toEqual({ status: "NO_CONCERN_IDENTIFIED" });
  });

  it("treats a 409 as not ready yet, and skips cases already scored", async () => {
    const one = [assessment("TEACHER", "2026-10-01T00:00:00Z")];
    mockRequest.mockRejectedValue(new ApiError(409, "Both must complete"));
    await expect(
      scoreIfWaitIsOver("c1", one, null, new Date("2026-10-09")),
    ).resolves.toBeNull();
    mockRequest.mockReset();
    await expect(
      scoreIfWaitIsOver("c1", one, 1.5, new Date("2026-10-09")),
    ).resolves.toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("reads the outcome from the case", () => {
    expect(screeningOutcome("NO_CONCERN_IDENTIFIED", 0.8)).toBe("no_concern");
    expect(screeningOutcome("PARENT_SCREENING_COMPLETED", 2.4)).toBe("plan");
    expect(screeningOutcome("TEACHER_SCREENING_COMPLETED", null)).toBe(
      "pending",
    );
  });

  it("closes the screening once the case is scored or finished", () => {
    expect(
      screeningIsOpen({ status: "INITIATED", domain_density_score: null }),
    ).toBe(true);
    expect(
      screeningIsOpen({
        status: "TEACHER_SCREENING_COMPLETED",
        domain_density_score: null,
      }),
    ).toBe(true);
    expect(
      screeningIsOpen({
        status: "PARENT_SCREENING_COMPLETED",
        domain_density_score: 2.4,
      }),
    ).toBe(false);
    expect(
      screeningIsOpen({
        status: "NO_CONCERN_IDENTIFIED",
        domain_density_score: 0.5,
      }),
    ).toBe(false);
    expect(
      screeningIsOpen({ status: "CLOSED", domain_density_score: null }),
    ).toBe(false);
  });

  it("stays closed once the case has moved past screening, even without a score", () => {
    for (const status of [
      "IEP_PENDING_APPROVAL",
      "IEP_ACTIVE",
      "EVALUATION_PENDING",
      "NO_CONCERN_IDENTIFIED",
      "COMPLETED",
      "CLOSED",
    ]) {
      expect(screeningIsOpen({ status, domain_density_score: null })).toBe(
        false,
      );
    }
  });
});
