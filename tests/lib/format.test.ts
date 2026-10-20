import { formatDate, labelOf } from "@/lib/format";

describe("labelOf", () => {
  it("turns a status into readable words", () => {
    expect(labelOf("NO_CONCERN_IDENTIFIED")).toMatch(/no concern identified/i);
  });

  it("capitalises a single word", () => {
    expect(labelOf("CLOSED")).toBe("Closed");
  });
});

describe("formatDate", () => {
  it("shows a dash when there is no date", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats a real date", () => {
    expect(formatDate("2026-10-20T01:59:21.022Z")).toMatch(/2026/);
  });
});
