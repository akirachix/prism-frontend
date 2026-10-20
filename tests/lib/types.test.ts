import { FINISHED_STATUSES } from "@/lib/types";

describe("FINISHED_STATUSES", () => {
  it("contains the three finished statuses", () => {
    expect(FINISHED_STATUSES).toEqual([
      "COMPLETED",
      "NO_CONCERN_IDENTIFIED",
      "CLOSED",
    ]);
  });

  it("does not treat a started case as finished", () => {
    expect(FINISHED_STATUSES).not.toContain("INITIATED");
  });
});
