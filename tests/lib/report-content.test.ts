import {
  describeReport,
  displayValue,
  humanize,
  reportDisclaimer,
} from "@/lib/report-content";

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

describe("describeReport with the backend report builder", () => {
  const content = {
    disclaimer: "This report is not a diagnosis.",
    summary: {
      overall_score: 2.75,
      scale_max: 3,
      primary_domain: "ADHD",
      support_plan_recommended: true,
      next_step: "Talk with your child's teacher.",
    },
    domains: [
      {
        domain: "ADHD",
        tool: "SNAP_IV",
        score: 2.75,
        scale_max: 3,
        level: "HIGH",
        band_label: "High",
        meaning: "Attention difficulties were seen often.",
      },
    ],
    not_screened: [{ domain: "DYSLEXIA", status: "Not screened further" }],
  };
  const sections = describeReport(content);

  it("shows each area with its level and meaning in plain words", () => {
    expect(
      sections.find((s) => s.title === "Attention and activity")?.rows,
    ).toEqual([
      { label: "Score", value: "2.8 out of 3" },
      { label: "What we saw", value: "Worth extra support" },
      {
        label: "What this means",
        value: "Attention difficulties were seen often.",
      },
    ]);
  });

  it("lists areas that were not looked at further", () => {
    expect(
      sections.find((s) => s.title === "Areas not looked at further")?.rows,
    ).toEqual([
      {
        label: "Reading and spelling",
        value: "No further questions were needed",
      },
    ]);
  });

  it("shows the overall score with its scale in the overview", () => {
    const overview = sections.find((s) => s.title === "Overview");
    const row = overview?.rows.find((r) => r.label === "Overall score");
    expect(row?.value).toBe("2.8 out of 3");
  });

  it("hides raw scales, tools and band labels", () => {
    const text = JSON.stringify(sections);
    for (const hidden of ["2.75", "Scale max", "SNAP_IV", "Band label"]) {
      expect(text).not.toContain(hidden);
    }
  });

  it("keeps the disclaimer out of the sections so it shows only once", () => {
    expect(JSON.stringify(sections)).not.toContain("not a diagnosis");
    expect(reportDisclaimer(content)).toBe("This report is not a diagnosis.");
    expect(reportDisclaimer({})).toBeNull();
  });

  it("gives every section its own title", () => {
    const titles = sections.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("skips an empty not-screened list", () => {
    const titles = describeReport({ ...content, not_screened: [] }).map(
      (s) => s.title,
    );
    expect(titles).not.toContain("Areas not looked at further");
  });
});
