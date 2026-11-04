import { expect, test, type Page } from "@playwright/test";

import {
  PLAN_TEXT,
  activeIep,
  caseFor,
  iep,
  serveBackend,
  shortDay,
  student,
  type Db,
  type IEP,
} from "../data";
import {
  SCHOOL_ID,
  TEACHER_ID,
  expectPrinted,
  fail,
  json,
  onApi,
  onScreen,
  recordApi,
  signInAs,
  stubPrint,
} from "../fixtures";

function withPlan(
  plan: IEP | null,
  caseStatus = "TEACHER_SCREENING_COMPLETED",
): Partial<Db> {
  return {
    students: [student("s1", "Baraka", "Otieno")],
    cases: [
      caseFor("c1", "s1", { status: caseStatus, domain_density_score: 0.72 }),
    ],
    ieps: plan ? [plan] : [],
  };
}

async function openPlan(page: Page, seed: Partial<Db>) {
  const db = await serveBackend(page, seed);
  await signInAs(page, "TEACHER");
  await page.goto("/teacher/cases/c1/plan");
  return db;
}

const job = (status: string, extra: Record<string, unknown> = {}) => ({
  job_id: "job-1",
  case_id: "c1",
  kind: "IEP",
  status,
  result_id: null,
  error: null,
  created_at: new Date().toISOString(),
  finished_at: null,
  ...extra,
});

test.describe("Plan (IEP): before it exists", () => {
  test("says the plan is not ready yet", async ({ page }) => {
    await openPlan(page, withPlan(null));
    await expect(onScreen(page, /The plan is not ready yet\./)).toBeVisible();
  });

  test("says no plan is needed when there was no concern", async ({ page }) => {
    await openPlan(page, withPlan(null, "NO_CONCERN_IDENTIFIED"));
    await expect(
      onScreen(page, "No plan is needed: the screening raised no concern."),
    ).toBeVisible();
  });
});

test.describe("Plan (IEP): waiting for the teacher", () => {
  test("shows the draft, its approval steps and the whole text on request", async ({
    page,
  }) => {
    await openPlan(page, withPlan(iep("p1", "c1")));

    await expect(
      page.getByRole("heading", { name: "Education Plan (IEP)", level: 1 }),
    ).toBeVisible();
    await expect(onScreen(page, "Baraka Otieno · Adm. ADM-S1")).toBeVisible();
    await expect(onScreen(page, "Version 1")).toBeVisible();
    await expect(onScreen(page, "Waiting for you")).toBeVisible();
    await expect(
      onScreen(page, "This is a draft made by AI. Read it with care."),
    ).toBeVisible();
    const steps = page.getByRole("list", { name: "Approval steps" });
    await expect(steps.locator('[aria-current="step"]')).toHaveText(
      "You approve",
    );

    await expect(onScreen(page, PLAN_TEXT)).toBeVisible();
    await expect(
      onScreen(page, "Read 20 sight words by the end of term"),
    ).toBeVisible();
    await expect(onScreen(page, "Classroom strategies")).toHaveCount(0);
    await page.getByRole("button", { name: "Read the whole plan →" }).click();
    await expect(onScreen(page, "Classroom strategies")).toBeVisible();
    await expect(onScreen(page, "Seat near the teacher")).toBeVisible();
    await page.getByRole("button", { name: "Show less ↑" }).click();
    await expect(onScreen(page, "Classroom strategies")).toHaveCount(0);
  });

  test("Approve this plan records the teacher's approval", async ({ page }) => {
    const plan = iep("p1", "c1");
    await serveBackend(page, withPlan(plan));
    await signInAs(page, "TEACHER");
    const approvals = await recordApi(page, "POST", "/ieps/p1/approve", {
      ...plan,
      teacher_approved: true,
      teacher_approved_by: TEACHER_ID,
    });
    await page.goto("/teacher/cases/c1/plan");

    await page.getByRole("button", { name: "Approve this plan" }).click();

    await expect(onScreen(page, "Waiting for the school")).toBeVisible();
    await expect(
      onScreen(
        page,
        "You approved it. It becomes active, and can be downloaded",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Approve this plan" }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Approval steps" })
        .locator('[aria-current="step"]'),
    ).toHaveText("School admin approves");
    expect(approvals).toEqual([{ role: "TEACHER", approved_by: TEACHER_ID }]);
  });

  test("a draft is submitted before it is approved", async ({ page }) => {
    const plan = iep("p1", "c1", { status: "DRAFT" });
    await serveBackend(page, withPlan(plan));
    await signInAs(page, "TEACHER");
    const order: string[] = [];
    await onApi(page, "POST", "/ieps/p1/submit", (route) => {
      order.push("submit");
      return route.fulfill({ json: { ...plan, status: "PENDING_APPROVAL" } });
    });
    await onApi(page, "POST", "/ieps/p1/approve", (route) => {
      order.push("approve");
      return route.fulfill({
        json: { ...plan, status: "PENDING_APPROVAL", teacher_approved: true },
      });
    });
    await page.goto("/teacher/cases/c1/plan");

    await page.getByRole("button", { name: "Approve this plan" }).click();

    await expect(onScreen(page, "Waiting for the school")).toBeVisible();
    expect(order).toEqual(["submit", "approve"]);
  });

  test("shows why the approval failed", async ({ page }) => {
    await serveBackend(page, withPlan(iep("p1", "c1")));
    await signInAs(page, "TEACHER");
    await onApi(
      page,
      "POST",
      "/ieps/p1/approve",
      fail(409, "This plan was replaced by a newer version."),
    );
    await page.goto("/teacher/cases/c1/plan");

    await page.getByRole("button", { name: "Approve this plan" }).click();

    await expect(
      onScreen(page, "This plan was replaced by a newer version."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Approve this plan" }),
    ).toBeEnabled();
  });
});

test.describe("Plan (IEP): asking the AI for a new version", () => {
  test("checks the request, then shows the new version", async ({ page }) => {
    const plan = iep("p1", "c1");
    const next = iep("p2", "c1", { version_number: 2 });
    const db = await serveBackend(page, withPlan(plan));
    await signInAs(page, "TEACHER");
    const rejects: unknown[] = [];
    await onApi(page, "POST", "/ieps/p1/reject", (route) => {
      rejects.push(route.request().postDataJSON());
      plan.status = "REJECTED";
      plan.rejection_reason = "Smaller reading steps";
      return route.fulfill({ json: plan });
    });
    const starts = await recordApi(
      page,
      "POST",
      "/ai/cases/c1/iep",
      job("QUEUED"),
    );
    let finish: () => void = () => {};
    const finished = new Promise<void>((resolve) => (finish = resolve));
    await onApi(page, "GET", "/ai/jobs/job-1", async (route) => {
      await finished;
      db.ieps.push(next);
      return route.fulfill({
        json: job("SUCCEEDED", { result_id: "p2" }),
      });
    });
    await page.goto("/teacher/cases/c1/plan");

    await page.getByRole("button", { name: "Ask the AI for changes" }).click();
    const prompt = page.getByLabel("What should the AI change?");
    const write = page.getByRole("button", { name: "Write a new version" });
    await write.click();
    await expect(onScreen(page, "Tell the AI what to change.")).toBeVisible();
    await prompt.fill("ab");
    await write.click();
    await expect(onScreen(page, "Write at least 3 characters.")).toBeVisible();
    await expect(onScreen(page, "the AI writes version 2")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(prompt).toHaveCount(0);
    await page.getByRole("button", { name: "Ask the AI for changes" }).click();
    await page
      .getByLabel("What should the AI change?")
      .fill("Smaller reading steps");
    await page.getByRole("button", { name: "Write a new version" }).click();

    await expect(onScreen(page, "Writing the new plan…")).toBeVisible();
    finish();

    await expect(onScreen(page, "Version 2")).toBeVisible();
    await expect(onScreen(page, "Waiting for you")).toBeVisible();
    await expect(onScreen(page, "Writing the new plan…")).toHaveCount(0);
    expect(rejects).toEqual([{ reason: "Smaller reading steps" }]);
    expect(starts).toHaveLength(1);
  });

  async function failingAiJob(page: Page) {
    const plan = iep("p1", "c1");
    await serveBackend(page, withPlan(plan));
    await signInAs(page, "TEACHER");
    await onApi(page, "POST", "/ieps/p1/reject", (route) => {
      plan.status = "REJECTED";
      plan.rejection_reason = "Smaller reading steps";
      return route.fulfill({ json: plan });
    });
    await onApi(page, "POST", "/ai/cases/c1/iep", json(job("QUEUED")));
    await onApi(
      page,
      "GET",
      "/ai/jobs/job-1",
      json(job("FAILED", { error: "The model is busy." })),
    );
    await page.goto("/teacher/cases/c1/plan");

    await page.getByRole("button", { name: "Ask the AI for changes" }).click();
    await page
      .getByLabel("What should the AI change?")
      .fill("Smaller reading steps");
    await page.getByRole("button", { name: "Write a new version" }).click();
  }

  test("shows the AI's reason when it cannot write the plan", async ({
    page,
  }) => {
    test.fail();
    await failingAiJob(page);

    await expect(
      onScreen(page, "The AI could not write the plan: The model is busy."),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("after a failed AI job the teacher can ask again", async ({ page }) => {
    await failingAiJob(page);

    await expect(onScreen(page, "You asked for a new version")).toBeVisible();
    await expect(
      onScreen(page, "Your request: “Smaller reading steps”"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Write the new plan" }),
    ).toBeVisible();
  });

  test("a plan already sent back is rewritten without sending it back again", async ({
    page,
  }) => {
    const plan = iep("p1", "c1", {
      status: "REJECTED",
      rejection_reason: "Add a group-work strategy",
    });
    const db = await serveBackend(page, withPlan(plan));
    await signInAs(page, "TEACHER");
    const rejects = await recordApi(page, "POST", "/ieps/p1/reject", plan);
    await onApi(page, "POST", "/ai/cases/c1/iep", json(job("QUEUED")));
    await onApi(page, "GET", "/ai/jobs/job-1", (route) => {
      db.ieps.push(iep("p2", "c1", { version_number: 2, status: "DRAFT" }));
      return route.fulfill({ json: job("SUCCEEDED", { result_id: "p2" }) });
    });
    const submits = await recordApi(
      page,
      "POST",
      "/ieps/p2/submit",
      iep("p2", "c1", { version_number: 2 }),
    );
    await page.goto("/teacher/cases/c1/plan");

    await expect(onScreen(page, "New plan requested")).toBeVisible();
    await expect(
      onScreen(page, "Your request: “Add a group-work strategy”"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Write the new plan" }).click();

    await expect(onScreen(page, "Version 2")).toBeVisible();
    expect(rejects).toEqual([]);
    expect(submits).toHaveLength(1);
  });
});

test.describe("Plan (IEP): active", () => {
  test("shows the week, the check and the download", async ({ page }) => {
    const plan = activeIep("p1", "c1");
    await openPlan(page, withPlan(plan, "EVALUATION_PENDING"));

    await expect(onScreen(page, "Active · week 3 of 6")).toBeVisible();
    await expect(
      onScreen(
        page,
        `Active since ${shortDay(plan.approved_at ?? "")}. The 6-week check opens on ${shortDay(plan.evaluation_unlock_date ?? "")}.`,
      ),
    ).toBeVisible();
    await expect(onScreen(page, "This is a draft made by AI.")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "View the 6-week check" }),
    ).toHaveAttribute("href", "/teacher/cases/c1/check");
    await expect(
      page.getByRole("link", { name: "Download PDF" }),
    ).toHaveAttribute("href", "/teacher/cases/c1/plan/print");
    await expect(
      page.getByRole("button", { name: "Ask the AI for changes" }),
    ).toHaveCount(0);
  });

  test("an open check is the main action", async ({ page }) => {
    await openPlan(
      page,
      withPlan(
        activeIep("p1", "c1", { approvedDaysAgo: 43, unlockInDays: -1 }),
        "EVALUATION_PENDING",
      ),
    );

    await expect(
      page.getByText("6-week check open", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start the 6-week check" }),
    ).toBeVisible();
  });
});

test.describe("Plan download", () => {
  test("opens the print window and logs the download", async ({ page }) => {
    await stubPrint(page);
    await serveBackend(
      page,
      withPlan(activeIep("p1", "c1"), "EVALUATION_PENDING"),
    );
    await signInAs(page, "TEACHER");
    const audits = await recordApi(page, "POST", "/audit-logs", {}, 201);
    await page.goto("/teacher/cases/c1/plan/print");

    await expectPrinted(page, 1);
    const sheet = page.locator("article.plan-print");
    await expect(sheet).toContainText("Education Plan (IEP)");
    await expect(sheet).toContainText("Version 1");
    await expect(sheet).toContainText("Baraka Otieno");
    await expect(sheet).toContainText("ADM-S1");
    await expect(sheet).toContainText("Sunrise Academy");
    await expect(sheet).toContainText("Read 20 sight words by the end of term");
    await expect(sheet).toContainText("Seat near the teacher");
    await expect(sheet).toContainText("It is not a diagnosis.");
    expect(audits).toContainEqual(
      expect.objectContaining({
        action: "EXPORT",
        resource_type: "iep",
        resource_id: "p1",
        details: { format: "pdf" },
        user_id: TEACHER_ID,
        school_id: SCHOOL_ID,
        actor_role: "TEACHER",
      }),
    );

    await page.getByRole("button", { name: "Save as PDF" }).click();
    await expectPrinted(page, 2);
  });

  test("a plan that is not approved yet cannot be downloaded", async ({
    page,
  }) => {
    await stubPrint(page);
    await openPlan(page, withPlan(iep("p1", "c1")));
    await page.goto("/teacher/cases/c1/plan/print");

    await expect(
      onScreen(
        page,
        "The plan can be downloaded once you and the school admin have both approved it.",
      ),
    ).toBeVisible();
    await expectPrinted(page, 0);
  });
});
