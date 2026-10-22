import { combine, isComplete, levelOf, scoreAnswers } from "@/lib/scoring";
import { questionSetFor } from "@/lib/screening-questions";

const school = questionSetFor(7);

function answerAll(value: number) {
  return Object.fromEntries(
    school.parts.flatMap((p) => p.questions).map((q) => [q.id, value]),
  );
}

describe("scoreAnswers", () => {
  it("gives each domain its own average on a 0-3 scale", () => {
    const scores = scoreAnswers(school, answerAll(3));
    expect(scores).toEqual({ AUTISM: 3, ADHD: 3, DYSLEXIA: 3 });
  });

  it("leaves out domains with no answers yet", () => {
    const scores = scoreAnswers(school, { "aut-1": 1.5, "aut-2": 0 });
    expect(scores).toEqual({ AUTISM: 0.75 });
  });
});

describe("levelOf", () => {
  it("maps scores to low, medium and elevated", () => {
    expect(levelOf(0)).toBe("LOW");
    expect(levelOf(1)).toBe("MEDIUM");
    expect(levelOf(2)).toBe("ELEVATED");
    expect(levelOf(null)).toBe("LOW");
  });
});

describe("combine", () => {
  it("never averages domains together", () => {
    const result = combine({ AUTISM: 0, ADHD: 2.5 }, { AUTISM: 0, ADHD: 2.2 });
    expect(result.levels.ADHD).toBe("ELEVATED");
    expect(result.levels.AUTISM).toBe("LOW");
    expect(result.concern).toBe(true);
    expect(result.primaryDomain).toBe("ADHD");
  });

  it("treats a strong teacher/parent disagreement as a concern", () => {
    const result = combine({ DYSLEXIA: 1.8 }, { DYSLEXIA: 0.1 });
    expect(result.discrepancies).toEqual(["DYSLEXIA"]);
    expect(result.levels.DYSLEXIA).toBe("ELEVATED");
    expect(result.concern).toBe(true);
  });

  it("reports no concern when every domain is low", () => {
    const result = combine({ AUTISM: 0.2, ADHD: 0.5 }, { AUTISM: 0.4, ADHD: 0.3 });
    expect(result.concern).toBe(false);
    expect(result.primaryDomain).toBeNull();
    expect(result.densityScore).toBe(0);
  });
});

describe("isComplete", () => {
  it("is true only when every question has an answer", () => {
    expect(isComplete(school, answerAll(0))).toBe(true);
    expect(isComplete(school, { "aut-1": 0 })).toBe(false);
  });
});
