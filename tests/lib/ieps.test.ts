import { request } from "@/lib/api";
import {
  approvalSteps,
  canDownload,
  currentIep,
  evaluationIsOpen,
  iepsApi,
  plansForCase,
  planState,
  planWeek,
  regeneratePlan,
  weeksElapsed,
} from "@/lib/ieps";
import { makeIep } from "@/tests/iep-helpers";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

describe("iepsApi", () => {
  it("lists a case's plans", async () => {
    await iepsApi.list({ case_id: "c1" });
    expect(mockRequest).toHaveBeenCalledWith("/ieps?case_id=c1");
  });

  it("approves as the teacher", async () => {
    await iepsApi.approve("i1", "TEACHER", "t1");
    expect(mockRequest).toHaveBeenCalledWith("/ieps/i1/approve", {
      method: "POST",
      body: JSON.stringify({ role: "TEACHER", approved_by: "t1" }),
    });
  });

  it("sends a plan back with the reason", async () => {
    await iepsApi.reject("i1", "Goals are too hard");
    expect(mockRequest).toHaveBeenCalledWith("/ieps/i1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "Goals are too hard" }),
    });
  });

  it("submits a draft", async () => {
    await iepsApi.submit("i1");
    expect(mockRequest).toHaveBeenCalledWith("/ieps/i1/submit", {
      method: "POST",
    });
  });
});

describe("currentIep", () => {
  it("picks the newest version that was not replaced", () => {
    const plans = [
      makeIep({ iep_id: "old", version_number: 1, status: "SUPERSEDED" }),
      makeIep({ iep_id: "new", version_number: 2 }),
    ];
    expect(currentIep(plans)?.iep_id).toBe("new");
  });
});

describe("evaluationIsOpen and weeksElapsed", () => {
  const active = makeIep({
    status: "ACTIVE",
    approved_at: "2026-09-01T00:00:00Z",
    evaluation_unlock_date: "2026-10-13T00:00:00Z",
  });

  it("opens six weeks after approval", () => {
    expect(evaluationIsOpen(active, new Date("2026-10-14"))).toBe(true);
    expect(evaluationIsOpen(active, new Date("2026-10-01"))).toBe(false);
  });

  it("counts the weeks since approval", () => {
    expect(weeksElapsed(active, new Date("2026-09-16T00:00:00Z"))).toEqual({
      week: 2,
      total: 6,
    });
  });
});

describe("planState", () => {
  it("tells the teacher when the plan waits for her", () => {
    expect(planState(makeIep()).label).toBe("Waiting for you");
    expect(planState(makeIep()).waitingForMe).toBe(true);
  });

  it("waits for the school once the teacher approved", () => {
    const iep = makeIep({ teacher_approved: true });
    expect(planState(iep)).toMatchObject({
      label: "Waiting for the school",
      waitingForMe: false,
    });
  });

  it("shows a new version was asked for", () => {
    expect(planState(makeIep({ status: "REJECTED" })).label).toBe(
      "New plan requested",
    );
  });
});

describe("approvalSteps", () => {
  it("points at the teacher first, then the school, then active", () => {
    const current = (iep: ReturnType<typeof makeIep>) =>
      approvalSteps(iep).find((step) => step.current)?.label;
    expect(current(makeIep())).toBe("You approve");
    expect(current(makeIep({ teacher_approved: true }))).toBe(
      "School admin approves",
    );
    expect(
      current(
        makeIep({
          status: "ACTIVE",
          teacher_approved: true,
          admin_approved: true,
        }),
      ),
    ).toBeUndefined();
  });
});

describe("planWeek", () => {
  it("counts from week 1 and stops at week 6", () => {
    const iep = makeIep({
      status: "ACTIVE",
      approved_at: "2026-09-01T00:00:00Z",
    });
    expect(planWeek(iep, new Date("2026-09-02T00:00:00Z"))).toBe(1);
    expect(planWeek(iep, new Date("2026-09-16T00:00:00Z"))).toBe(3);
    expect(planWeek(iep, new Date("2026-12-01T00:00:00Z"))).toBe(6);
  });
});

describe("canDownload", () => {
  it("allows only an active plan", () => {
    expect(canDownload(makeIep())).toBe(false);
    expect(canDownload(makeIep({ teacher_approved: true }))).toBe(false);
    expect(canDownload(makeIep({ status: "ACTIVE" }))).toBe(true);
    expect(canDownload(null)).toBe(false);
  });
});

describe("regeneratePlan", () => {
  const noWait = { sleep: async () => {}, intervalMs: 1, timeoutMs: 10 };

  function serve(routes: Record<string, unknown[]>) {
    mockRequest.mockImplementation(async (path: string) => {
      const queue = routes[path];
      if (!queue || queue.length === 0) throw new Error(`unexpected ${path}`);
      return queue.length > 1 ? queue.shift() : queue[0];
    });
  }

  it("sends the request as the reason, asks the AI, and returns the new version", async () => {
    const next = makeIep({ iep_id: "i2", version_number: 2 });
    serve({
      "/ieps/i1/reject": [makeIep({ status: "REJECTED" })],
      "/ai/cases/c1/iep": [{ job_id: "j1", status: "PENDING" }],
      "/ai/jobs/j1": [
        { job_id: "j1", status: "RUNNING" },
        { job_id: "j1", status: "SUCCEEDED", result_id: "i2" },
      ],
      "/ieps/i2": [next],
    });

    await expect(
      regeneratePlan(makeIep(), "  Smaller reading steps ", noWait),
    ).resolves.toEqual(next);
    expect(mockRequest).toHaveBeenCalledWith("/ieps/i1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "Smaller reading steps" }),
    });
    expect(mockRequest).toHaveBeenCalledWith("/ai/cases/c1/iep", {
      method: "POST",
    });
  });

  it("does not send back a plan that is already sent back", async () => {
    serve({
      "/ai/cases/c1/iep": [{ job_id: "j1", status: "PENDING" }],
      "/ai/jobs/j1": [{ job_id: "j1", status: "SUCCEEDED", result_id: "i2" }],
      "/ieps/i2": [makeIep({ iep_id: "i2", version_number: 2 })],
    });
    await regeneratePlan(makeIep({ status: "REJECTED" }), "x", noWait);
    expect(
      mockRequest.mock.calls.some(([path]) => path === "/ieps/i1/reject"),
    ).toBe(false);
  });

  it("submits a new draft so the teacher can approve it", async () => {
    const submitted = makeIep({ iep_id: "i2", version_number: 2 });
    serve({
      "/ieps/i1/reject": [makeIep({ status: "REJECTED" })],
      "/ai/cases/c1/iep": [{ job_id: "j1", status: "PENDING" }],
      "/ai/jobs/j1": [{ job_id: "j1", status: "SUCCEEDED", result_id: "i2" }],
      "/ieps/i2": [makeIep({ iep_id: "i2", status: "DRAFT" })],
      "/ieps/i2/submit": [submitted],
    });
    await expect(regeneratePlan(makeIep(), "x", noWait)).resolves.toEqual(
      submitted,
    );
  });

  it("explains when the AI fails", async () => {
    serve({
      "/ieps/i1/reject": [makeIep({ status: "REJECTED" })],
      "/ai/cases/c1/iep": [{ job_id: "j1", status: "PENDING" }],
      "/ai/jobs/j1": [{ job_id: "j1", status: "FAILED", error: "busy" }],
    });
    await expect(regeneratePlan(makeIep(), "x", noWait)).rejects.toThrow(
      "The AI could not write the plan: busy",
    );
  });
});

describe("plansForCase", () => {
  it("reads every page of a case's plans", async () => {
    const firstPage = Array.from({ length: 200 }, (_, i) =>
      makeIep({ iep_id: `p${i}` }),
    );
    mockRequest.mockImplementation(async (path: string) =>
      path.includes("offset=200") ? [makeIep({ iep_id: "last" })] : firstPage,
    );
    const plans = await plansForCase("c1");
    expect(plans).toHaveLength(201);
    expect(plans[200].iep_id).toBe("last");
    expect(mockRequest.mock.calls[0][0]).toMatch(/case_id=c1/);
  });
});
