"use client";

import { ClipboardCheck, NotebookPen, UserRound } from "lucide-react";
import Link from "next/link";

import { useUser } from "@/_components/SessionProvider";
import { ButtonLink } from "@/_components/ui/Button";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import LatestUpdates from "@/_components/updates/LatestUpdates";
import { useLoad } from "@/_components/useLoad";
import { planForCase } from "@/lib/evaluation-flow";
import { parentEvaluationUpdates } from "@/lib/evaluation-updates";
import { SCREENING_ENABLED } from "@/lib/features";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import { studentName } from "@/lib/lookups";
import { orNull, reportsApi, type Plan } from "@/lib/reports";
import {
  scoreIfWaitIsOver,
  screeningApi,
  screeningIsOpen,
  stageFor,
  type Assessment,
} from "@/lib/screening";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import { useChild } from "../_components/ChildProvider";
import "@/_components/portal.css";
import "./parent-home.css";

function evaluationOpen(plan: Plan | null, now = new Date()): boolean {
  if (!plan?.evaluation_unlock_date) return false;
  return new Date(plan.evaluation_unlock_date).getTime() <= now.getTime();
}

function statusFor(
  caseItem: Case | null,
  assessments: Assessment[],
  plan: Plan | null,
) {
  if (!caseItem) return "Nothing started";
  if (caseItem.status === "NO_CONCERN_IDENTIFIED") return "No concern found";
  if (caseItem.status === "COMPLETED") return "Completed";
  if (caseItem.status === "CLOSED") return "Closed";
  if (plan) return evaluationOpen(plan) ? "Evaluation open" : "Plan active";
  if (caseItem.domain_density_score !== null) return "Plan being prepared";
  const stage = stageFor(assessments, "PARENT");
  if (stage === "not_started") return "Your screening is waiting";
  if (stage === "in_progress") return "Your screening is in progress";
  if (stage === "waiting_for_other") return "Waiting for the teacher";
  return "Result being worked out";
}

async function loadCase(caseId: string) {
  let caseItem = await casesApi.get(caseId);
  const [assessments, plan] = await Promise.all([
    screeningApi.assessments(caseId),
    orNull(reportsApi.plan(caseId)),
  ]);
  if (
    await scoreIfWaitIsOver(caseId, assessments, caseItem.domain_density_score)
  ) {
    caseItem = await casesApi.get(caseId);
  }
  return { caseItem, assessments, plan };
}

export default function ParentHomePage() {
  const user = useUser();
  const {
    child,
    children,
    caseItem: listed,
    loading,
    error,
    selectChild,
  } = useChild();
  const caseId = listed?.case_id ?? null;
  const extra = useLoad(
    () => (caseId ? loadCase(caseId) : Promise.resolve(null)),
    [caseId],
  );

  const caseItem = extra.data?.caseItem ?? listed;
  const assessments = extra.data?.assessments ?? [];
  const plan = extra.data?.plan ?? null;
  const open = caseItem && !FINISHED_STATUSES.includes(caseItem.status);
  const stage = stageFor(assessments, "PARENT");
  const canAnswer =
    open &&
    caseItem !== null &&
    screeningIsOpen(caseItem) &&
    !plan &&
    !extra.loading &&
    !extra.error &&
    SCREENING_ENABLED &&
    (stage === "not_started" || stage === "in_progress");
  const updates = useLoad(async () => {
    if (!child || !caseId) return [];
    return parentEvaluationUpdates(child, await planForCase(caseId));
  }, [child?.student_id ?? null, caseId]);

  return (
    <main className="ui-page">
      <PageHeader title="Home" />
      <div className="ui-body parent-home">
        <div>
          <h2 className="parent-home__hello">
            Hello, {user.first_name || "parent"} 👋
          </h2>
          <p className="parent-home__lead">
            Here&apos;s your child&apos;s latest information.
          </p>
        </div>

        {children.length > 1 && (
          <div
            className="portal-chips"
            role="group"
            aria-label="Choose a child"
          >
            {children.map((kid) => (
              <button
                key={kid.student_id}
                type="button"
                className="portal-chip"
                aria-pressed={kid.student_id === child?.student_id}
                onClick={() => selectChild(kid.student_id)}
              >
                {kid.first_name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : !child ? (
          <Empty>
            Your account is not linked to a child yet. Please contact your
            child&apos;s teacher.
          </Empty>
        ) : (
          <>
            <section
              className="ui-card parent-home__child"
              aria-labelledby="child-title"
            >
              <div className="parent-home__child-head">
                <span className="parent-home__icon">
                  <UserRound size={26} aria-hidden="true" />
                </span>
                <h2 id="child-title" className="parent-home__child-title">
                  {studentName(child)}
                </h2>
              </div>
              <dl className="parent-home__facts">
                <div>
                  <dt>Date of birth</dt>
                  <dd>
                    {child.date_of_birth
                      ? new Date(child.date_of_birth).toLocaleDateString(
                          "en-KE",
                        )
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Class</dt>
                  <dd>{child.class_name ?? "—"}</dd>
                </div>
                <div>
                  <dt>Admission ID</dt>
                  <dd>{child.admission_number}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {extra.loading
                      ? "…"
                      : statusFor(caseItem, assessments, plan)}
                  </dd>
                </div>
              </dl>
              {extra.error && <Alert>{extra.error}</Alert>}
              <div className="parent-home__actions">
                {canAnswer && (
                  <ButtonLink href="/parent/screening" block>
                    {stage === "in_progress"
                      ? "Continue screening"
                      : "Start screening"}
                  </ButtonLink>
                )}
                <Link href="/parent/reports" className="parent-home__reports">
                  View reports
                </Link>
              </div>
            </section>

            <div className="parent-home__tiles">
              <Link
                href="/parent/reports"
                className="ui-card parent-home__tile"
              >
                <NotebookPen size={26} aria-hidden="true" />
                <span>
                  <strong>Plan and home activities</strong>
                  <span>
                    {plan
                      ? "Ideas to try at home"
                      : "Ready after the screening"}
                  </span>
                </span>
              </Link>
              <Link
                href="/parent/evaluation"
                className="ui-card parent-home__tile"
              >
                <ClipboardCheck size={26} aria-hidden="true" />
                <span>
                  <strong>Evaluation</strong>
                  <span>
                    {plan?.evaluation_unlock_date
                      ? evaluationOpen(plan)
                        ? "Open now"
                        : `Opens ${formatDay(plan.evaluation_unlock_date)}`
                      : "Opens 6 weeks after the plan"}
                  </span>
                </span>
              </Link>
            </div>
          </>
        )}

        <section className="portal-section" aria-labelledby="updates-title">
          <h2 id="updates-title" className="ui-section-title">
            Latest updates
          </h2>
          <LatestUpdates
            items={updates.data ?? []}
            loading={loading || updates.loading}
            error={updates.error}
          />
        </section>
      </div>
    </main>
  );
}
