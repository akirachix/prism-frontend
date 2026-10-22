import { attentionItems, studentStatus, type Classroom } from "@/lib/classroom";
import { makeCase, makeStudent } from "@/tests/helpers";
import { makeIep } from "@/tests/iep-helpers";

describe("studentStatus", () => {
  it("says when there is no case", () => {
    expect(studentStatus(undefined, undefined).label).toBe("No case yet");
  });

  it("asks the teacher to approve a waiting plan", () => {
    const status = studentStatus(makeCase(), makeIep());
    expect(status.label).toBe("Approve plan");
    expect(status.needsAction).toBe(true);
  });

  it("marks an active plan", () => {
    const status = studentStatus(
      makeCase(),
      makeIep({ status: "ACTIVE", evaluation_unlock_date: "2999-01-01T00:00:00Z" }),
    );
    expect(status.label).toBe("Plan active");
    expect(status.activePlan).toBe(true);
  });

  it("knows the parent is still to answer", () => {
    const status = studentStatus(makeCase({ status: "TEACHER_SCREENING_COMPLETED" }), undefined);
    expect(status.label).toBe("Waiting for parent");
    expect(status.needsAction).toBe(false);
  });

  it("knows both screenings are done once a density score exists", () => {
    const status = studentStatus(
      makeCase({ status: "TEACHER_SCREENING_COMPLETED", domain_density_score: 1 }),
      undefined,
    );
    expect(status.label).toBe("Plan being prepared");
  });
});

describe("attentionItems", () => {
  it("lists plans to approve first, then students with no case", () => {
    const withCase = makeStudent();
    const noCase = makeStudent({ student_id: "s2", first_name: "Cherly", last_name: "Njeri" });
    const caseItem = makeCase({ status: "TEACHER_SCREENING_COMPLETED", domain_density_score: 2 });
    const room: Classroom = {
      students: [withCase, noCase],
      cases: [caseItem],
      caseByStudent: new Map([[withCase.student_id, caseItem]]),
      iepByCase: new Map([[caseItem.case_id, makeIep()]]),
    };
    const items = attentionItems(room);
    expect(items[0].text).toBe("Approve or regenerate plan");
    expect(items[0].href).toBe("/teacher/cases/c1/plan");
    expect(items.some((i) => i.name === "Cherly Njeri" && i.action === "Start case")).toBe(true);
  });
});
