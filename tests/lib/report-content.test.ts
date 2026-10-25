import { describeReport, displayValue, humanize } from "@/lib/report-content";

describe("humanize", () => {
  it("turns keys into words", () => {
    expect(humanize("teacher_summary")).toBe("Teacher summary");
    expect(humanize("primaryDomain")).toBe("Main area to support");
  });

  it("never shows a clinical label for a domain", () => {
    expect(humanize("ADHD")).toBe("Attention and activity");
    expect(displayValue("AUTISM")).toBe("Social communication and play");
  });
});

describe("displayValue", () => {
  it("shows levels in plain words", () => {
    expect(displayValue("ELEVATED")).toBe("Worth extra support");
    expect(displayValue("LOW")).toBe("No concern seen");
  });

  it("handles empty values, booleans, numbers and lists", () => {
    expect(displayValue(null)).toBe("—");
    expect(displayValue(true)).toBe("Yes");
    expect(displayValue(2.456)).toBe("2.46");
    expect(displayValue([])).toBe("None");
  });
});

describe("describeReport", () => {
  it("shows results by area in plain words", () => {
    const sections = describeReport({
      kind: "screening",
      combined: { levels: { ADHD: "ELEVATED", AUTISM: "LOW" }, concern: true },
    });
    expect(
      sections.find((s) => s.title === "Together · Results by area")?.rows,
    ).toEqual([
      { label: "Attention and activity", value: "Worth extra support" },
      { label: "Social communication and play", value: "No concern seen" },
    ]);
    expect(sections.find((s) => s.title === "Together")?.rows).toEqual([
      { label: "Extra support suggested", value: "Yes" },
    ]);
  });

  it("hides raw answers and scores from parents", () => {
    const text = JSON.stringify(
      describeReport({
        teacher: {
          answers: { q1: 3 },
          scores: { ADHD: 2.4 },
          completed_at: null,
        },
      }),
    );
    expect(text).not.toContain("q1");
    expect(text).not.toContain("2.4");
  });

  it("puts top-level values in a summary", () => {
    expect(describeReport({ note: "Done in class" })).toEqual([
      { title: "Summary", rows: [{ label: "Note", value: "Done in class" }] },
    ]);
  });

  it("returns nothing for an empty report", () => {
    expect(describeReport({})).toEqual([]);
  });
});
