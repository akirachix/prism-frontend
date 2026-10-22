import { allQuestions, questionSetFor } from "@/lib/screening-questions";

describe("questionSetFor (age gate)", () => {
  it("gives 4-5 year olds autism and preschool ADHD only", () => {
    const set = questionSetFor(5);
    expect(set.ageGate).toBe("4-5");
    expect(set.parts.map((p) => p.domain)).toEqual(["AUTISM", "ADHD"]);
  });

  it("adds reading and language from age 6", () => {
    const set = questionSetFor(6);
    expect(set.ageGate).toBe("6-9");
    expect(set.parts.map((p) => p.domain)).toEqual([
      "AUTISM",
      "ADHD",
      "DYSLEXIA",
    ]);
  });

  it("uses the 6-9 set when the age is unknown", () => {
    expect(questionSetFor(null).ageGate).toBe("6-9");
  });

  it("never repeats a question id", () => {
    for (const age of [5, 7]) {
      const ids = allQuestions(questionSetFor(age)).map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("scores every option between 0 and 3", () => {
    for (const q of allQuestions(questionSetFor(7))) {
      for (const option of q.options) {
        expect(option.value).toBeGreaterThanOrEqual(0);
        expect(option.value).toBeLessThanOrEqual(3);
      }
    }
  });

  it("scores reverse-worded items the other way round", () => {
    const first = allQuestions(questionSetFor(7)).find(
      (q) => q.id === "aut-1",
    )!;
    expect(first.options[0]).toEqual({ label: "Always", value: 0 });
    expect(first.options[first.options.length - 1]).toEqual({
      label: "Never",
      value: 3,
    });
  });
});
