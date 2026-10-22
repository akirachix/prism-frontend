import { journeyFor } from "@/lib/journey";
import type { ScreeningContent } from "@/lib/screening";
import { makeCase } from "@/tests/helpers";

const done = { responder_id: "x", age_gate: "6-9" as const, answers: {}, scores: {}, updated_at: "", completed_at: "2026-10-01" };

describe("journeyFor", () => {
  it("puts the teacher's screening first when nothing is answered", () => {
    const steps = journeyFor(makeCase(), null, null, "TEACHER");
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "waiting", "locked", "locked"]);
    expect(steps[1].title).toBe("Your screening");
  });

  it("speaks to the parent from their side", () => {
    const steps = journeyFor(makeCase(), null, null, "PARENT");
    expect(steps[1].title).toBe("Teacher's screening");
    expect(steps[2].title).toBe("Your screening");
    expect(steps[2].state).toBe("current");
  });

  it("shows the plan being prepared once both are done", () => {
    const screening: ScreeningContent = { kind: "screening", teacher: done, parent: done };
    const steps = journeyFor(makeCase(), screening, null, "TEACHER");
    expect(steps[3]).toMatchObject({ state: "waiting", note: "Being prepared" });
  });

  it("explains when no plan is needed", () => {
    const steps = journeyFor(makeCase({ status: "NO_CONCERN_IDENTIFIED" }), null, null, "TEACHER");
    expect(steps[3].note).toMatch(/no concern/i);
  });
});
