"use client";

import { CalendarClock, Download, Lock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import EvaluationReports from "@/_components/evaluation/EvaluationReports";
import { useUser } from "@/_components/SessionProvider";
import Button, { ButtonLink } from "@/_components/ui/Button";
import {
  Alert,
  Avatar,
  Loading,
  PageHeader,
  Pill,
  ProgressBar,
  type PillTone,
} from "@/_components/ui/bits";
import { orNull, useLoad } from "@/_components/useLoad";
import { errorMessage, fetchAll } from "@/lib/api";
import { casesApi, latestCase } from "@/lib/cases";
import { studentStatus } from "@/lib/classroom";
import {
  evaluatedIep,
  lockCountdown,
  withCheckState,
} from "@/lib/evaluation-flow";
import { loadEvaluationReports } from "@/lib/evaluation-reports";
import { evaluationsApi, type EvaluationRound } from "@/lib/evaluations";
import { formatLongDay, labelOf } from "@/lib/format";
import { canDownload, iepsApi, weeksElapsed, type IEP } from "@/lib/ieps";
import { ageInYears, studentName, studentsApi } from "@/lib/lookups";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import { fullName, usersApi } from "@/lib/users";
import "@/_components/portal.css";
import "./student-profile.css";

async function quietly<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function loadProfile(studentId: string) {
  const student = await studentsApi.get(studentId);
  const [cases, invite, parent] = await Promise.all([
    fetchAll((limit, offset) =>
      casesApi.listBy({ student_id: studentId, limit, offset }),
    ),
    quietly(studentsApi.parentInvitation(studentId)),
    student.parent_id ? quietly(orNull(usersApi.get(student.parent_id))) : null,
  ]);
  const caseItem = latestCase(cases);
  const ieps = caseItem
    ? await fetchAll((limit, offset) =>
        iepsApi.list({ case_id: caseItem.case_id, limit, offset }),
      )
    : [];
  const plan = evaluatedIep(ieps);
  let round: EvaluationRound | null = null;
  let roundFailed = false;
  if (plan?.status === "ACTIVE") {
    try {
      round = await evaluationsApi.current(plan.iep_id);
    } catch {
      roundFailed = true;
    }
  }
  const firstPlan = [...ieps].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )[0];
  return {
    student,
    cases,
    caseItem,
    plan,
    firstPlanAt: firstPlan?.created_at ?? null,
    round,
    roundFailed,
    invite,
    parent,
  };
}

function nextStep(
  caseItem: Case,
  plan: IEP | null,
): { label: string; href: string } | null {
  const base = `/teacher/cases/${caseItem.case_id}`;
  if (FINISHED_STATUSES.includes(caseItem.status)) return null;
  const myScreeningWaiting =
    caseItem.status === "INITIATED" ||
    (caseItem.status === "PARENT_SCREENING_COMPLETED" &&
      caseItem.domain_density_score === null);
  if (myScreeningWaiting && !plan) {
    return { label: "Open my screening", href: `${base}/screening` };
  }
  if (
    plan?.status === "PENDING_APPROVAL" ||
    plan?.status === "DRAFT" ||
    plan?.status === "REJECTED"
  ) {
    return { label: "Review the plan", href: `${base}/plan` };
  }
  if (plan?.status === "ACTIVE") {
    return { label: "View the plan", href: `${base}/plan` };
  }
  return null;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="profile__fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CheckStatus({
  plan,
  round,
  failed,
  onRetry,
  retrying,
  caseId,
}: {
  plan: IEP;
  round: EvaluationRound | null;
  failed: boolean;
  onRetry: () => void;
  retrying: boolean;
  caseId: string;
}) {
  const checkHref = `/teacher/cases/${caseId}/check`;
  if (failed) {
    return (
      <div className="profile__check">
        <Alert tone="warning">
          We could not load the 6-week check status, so we cannot say whether it
          is open.{" "}
          <Button variant="link" onClick={onRetry} loading={retrying}>
            Try again
          </Button>
        </Alert>
      </div>
    );
  }
  if (!round || round.status === "NOT_APPROVED") {
    return (
      <p className="profile__muted">
        The 6-week check opens six weeks after the school administrator and you
        approve the plan.
      </p>
    );
  }
  if (round.status === "NOT_OPEN") {
    const { week, total } = weeksElapsed(plan);
    return (
      <div className="profile__check">
        <p>
          <CalendarClock size={18} aria-hidden="true" /> Opens on{" "}
          <strong>{formatLongDay(round.opens_at)}</strong>
        </p>
        <ProgressBar value={week} max={total} tone="orange" label="Weeks" />
        <span className="profile__muted">
          Week {week} of {total} since approval
        </span>
      </div>
    );
  }
  if (round.status === "LOCKED" && round.locked_until) {
    const { daysLeft, elapsedDays, totalDays } = lockCountdown(
      round.locked_until,
    );
    return (
      <div className="profile__check">
        <p>
          <Lock size={18} aria-hidden="true" /> Your answers are saved. The next
          check opens on <strong>{formatLongDay(round.locked_until)}</strong> (
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left).
        </p>
        <ProgressBar
          value={elapsedDays}
          max={totalDays}
          tone="orange"
          label="Days until the next check"
        />
        <ButtonLink href={checkHref} variant="outline" small>
          View my answers
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="profile__check">
      <p>
        <strong>The 6-week check is open.</strong>{" "}
        {round.my_responses.length > 0
          ? "Your last answers are filled in — update them."
          : "Answer it now; the parent answers the same questions."}
      </p>
      <ButtonLink href={checkHref} small>
        Start the 6-week check
      </ButtonLink>
    </div>
  );
}

type ReportTab = "PARENT" | "TEACHER";

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const user = useUser();
  const { data, error, loading, reload } = useLoad(
    () => loadProfile(studentId),
    [studentId],
  );
  const caseIds = data ? data.cases.map((item) => item.case_id) : null;
  const reports = useLoad(
    () => (caseIds ? loadEvaluationReports(caseIds) : Promise.resolve([])),
    [caseIds],
  );
  const [busy, setBusy] = useState<"start" | "invite" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [inviteLeft, setInviteLeft] = useState<number | null>(null);
  const [tab, setTab] = useState<ReportTab>("PARENT");

  const back = { href: "/teacher/students", label: "Back to my students" };

  if (loading && !data) {
    return (
      <main className="ui-page">
        <PageHeader title="Student" back={back} eyebrow="Students" />
        <Loading />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="ui-page">
        <PageHeader title="Student" back={back} eyebrow="Students" />
        <div className="ui-body">
          <Alert>{error ?? "We could not find this student."}</Alert>
        </div>
      </main>
    );
  }

  const { student, caseItem, plan, round, roundFailed, invite, parent } = data;
  const name = studentName(student);
  const age = ageInYears(student.date_of_birth);
  const open = caseItem && !FINISHED_STATUSES.includes(caseItem.status);
  const status = caseItem
    ? withCheckState(
        studentStatus(caseItem, plan ?? undefined),
        roundFailed ? "UNAVAILABLE" : round?.status,
      )
    : null;
  const step = caseItem ? nextStep(caseItem, plan) : null;
  const parentName = parent ? fullName(parent) : null;
  const parentEmail = parent?.email ?? invite?.parent_email ?? null;
  const resendsLeft = inviteLeft ?? invite?.resends_left ?? 0;
  const shownReports = (reports.data ?? []).filter((r) => r.role === tab);

  async function startCase() {
    setBusy("start");
    setActionError(null);
    try {
      await casesApi.create({
        school_id: student.school_id,
        student_id: student.student_id,
        initiated_by: user.user_id,
      });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function resendInvite() {
    setBusy("invite");
    setActionError(null);
    try {
      const result = await studentsApi.resendParentInvitation(
        student.student_id,
      );
      setInviteLeft(result.resends_left);
      setInviteNote(result.detail);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const planTone: PillTone =
    plan?.status === "ACTIVE"
      ? "sky"
      : plan?.status === "REJECTED"
        ? "red"
        : "outline";

  return (
    <main className="ui-page">
      <PageHeader
        title={name}
        back={back}
        eyebrow="Students"
        actions={
          open ? (
            <Link
              href={`/teacher/cases/${caseItem.case_id}/close`}
              className="ui-header-pill"
            >
              Close case
            </Link>
          ) : undefined
        }
      />

      <div className="ui-body profile">
        {actionError && <Alert>{actionError}</Alert>}

        <div className="profile__grid">
          <section className="ui-card profile__card" aria-labelledby="child-h">
            <div className="profile__hero">
              <Avatar name={name} id={student.student_id} size={64} />
              <div className="profile__hero-text">
                <h2 id="child-h" className="profile__name">
                  {name}
                </h2>
                <div className="profile__pills">
                  <Pill tone={student.is_active === false ? "grey" : "blush"}>
                    {student.is_active === false ? "Inactive" : "Active"}
                  </Pill>
                  {status && <Pill tone={status.tone}>{status.label}</Pill>}
                </div>
              </div>
            </div>
            <dl className="profile__facts">
              <Fact label="Admission no.">{student.admission_number}</Fact>
              <Fact label="Date of birth">
                {formatLongDay(student.date_of_birth)}
                {age !== null ? ` · ${age} years` : ""}
              </Fact>
              <Fact label="Gender">
                {student.gender ? labelOf(student.gender) : "—"}
              </Fact>
              <Fact label="Added">{formatLongDay(student.created_at)}</Fact>
            </dl>
          </section>

          <section className="ui-card profile__card" aria-labelledby="parent-h">
            <h2 id="parent-h" className="profile__heading">
              Parent or guardian
            </h2>
            <div className="profile__hero">
              <Avatar
                name={parentName ?? parentEmail ?? "Parent"}
                id={student.parent_id ?? undefined}
                size={48}
              />
              <div className="profile__hero-text">
                <strong>{parentName ?? "Name not shared yet"}</strong>
                {invite && (
                  <Pill tone={invite.accepted ? "sky" : "orange"}>
                    {invite.accepted ? "Joined Mirai" : "Invitation pending"}
                  </Pill>
                )}
              </div>
            </div>
            <ul className="profile__contacts">
              <li>
                <Mail size={18} aria-hidden="true" />
                {parentEmail ? (
                  <a href={`mailto:${parentEmail}`}>{parentEmail}</a>
                ) : (
                  <span>—</span>
                )}
              </li>
              <li>
                <Phone size={18} aria-hidden="true" />
                {parent?.phone ? (
                  <a href={`tel:${parent.phone.replace(/\s/g, "")}`}>
                    {parent.phone}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </li>
            </ul>
            {invite && !invite.accepted && (
              <div className="profile__invite">
                <span className="profile__muted">
                  {resendsLeft > 0
                    ? `${resendsLeft} of ${invite.max_resends} resends left. The link works for 14 days.`
                    : `All ${invite.max_resends} resends are used.`}
                </span>
                <Button
                  variant="outline"
                  small
                  onClick={resendInvite}
                  loading={busy === "invite"}
                  disabled={resendsLeft <= 0}
                >
                  Resend invitation
                </Button>
              </div>
            )}
            {inviteNote && (
              <p className="profile__ok" aria-live="polite">
                {inviteNote}
              </p>
            )}
          </section>

          <section className="ui-card profile__card" aria-labelledby="case-h">
            <h2 id="case-h" className="profile__heading">
              Case
            </h2>
            {!caseItem ? (
              <>
                <p className="profile__muted">
                  No case yet. Start one when a concern has lasted a few weeks.
                  You and the parent each answer a short screening.
                </p>
                <div className="ui-actions">
                  <Button onClick={startCase} loading={busy === "start"}>
                    Start a case
                  </Button>
                </div>
              </>
            ) : (
              <>
                <dl className="profile__facts">
                  <Fact label="Status">{labelOf(caseItem.status)}</Fact>
                  <Fact label="Started">
                    {formatLongDay(caseItem.created_at)}
                  </Fact>
                  <Fact label="Main area">
                    {caseItem.primary_domain
                      ? labelOf(caseItem.primary_domain)
                      : "—"}
                  </Fact>
                  {caseItem.closed_at && (
                    <Fact label="Closed">
                      {formatLongDay(caseItem.closed_at)}
                      {caseItem.closed_reason
                        ? ` · ${caseItem.closed_reason}`
                        : ""}
                    </Fact>
                  )}
                </dl>
                <div className="ui-actions">
                  {step && (
                    <ButtonLink href={step.href} small>
                      {step.label}
                    </ButtonLink>
                  )}
                  {!open && (
                    <Button
                      variant="outline"
                      small
                      onClick={startCase}
                      loading={busy === "start"}
                    >
                      Start a new case
                    </Button>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="ui-card profile__card" aria-labelledby="plan-h">
            <div className="profile__heading-row">
              <h2 id="plan-h" className="profile__heading">
                Plan (IEP)
              </h2>
              {plan && (
                <Pill tone={planTone}>
                  {plan.status === "ACTIVE" ? "Active" : labelOf(plan.status)}
                </Pill>
              )}
            </div>
            {!plan ? (
              <p className="profile__muted">
                {caseItem
                  ? "No plan yet. It is prepared when both screenings identify a concern."
                  : "A plan comes after a case and its screenings."}
              </p>
            ) : (
              <>
                <dl className="profile__facts">
                  <Fact label="First created">
                    {formatLongDay(data.firstPlanAt)}
                  </Fact>
                  <Fact label="This version">
                    v{plan.version_number} · {formatLongDay(plan.created_at)}
                  </Fact>
                  <Fact label="Approved">
                    {plan.approved_at
                      ? formatLongDay(plan.approved_at)
                      : plan.teacher_approved
                        ? "Waiting for the school admin"
                        : "Not yet"}
                  </Fact>
                </dl>
                {caseItem && canDownload(plan) && (
                  <div className="ui-actions">
                    <ButtonLink
                      href={`/teacher/cases/${caseItem.case_id}/plan/print`}
                      variant="outline"
                      small
                    >
                      <Download size={18} aria-hidden="true" /> Download PDF
                    </ButtonLink>
                  </div>
                )}
                <h3 className="profile__subheading">6-week check</h3>
                {caseItem && (
                  <CheckStatus
                    plan={plan}
                    round={round}
                    failed={roundFailed}
                    onRetry={reload}
                    retrying={loading}
                    caseId={caseItem.case_id}
                  />
                )}
              </>
            )}
          </section>
        </div>

        <section
          id="reports"
          className="ui-card profile__card profile__reports"
          aria-labelledby="reports-h"
        >
          <div className="profile__heading-row">
            <h2 id="reports-h" className="profile__heading">
              6-week evaluation reports
            </h2>
            <div
              className="portal-chips"
              role="group"
              aria-label="Whose reports"
            >
              <button
                type="button"
                className="portal-chip"
                aria-pressed={tab === "PARENT"}
                onClick={() => setTab("PARENT")}
              >
                From the parent
              </button>
              <button
                type="button"
                className="portal-chip"
                aria-pressed={tab === "TEACHER"}
                onClick={() => setTab("TEACHER")}
              >
                Yours
              </button>
            </div>
          </div>
          {reports.loading && !reports.data ? (
            <Loading label="Loading reports…" />
          ) : reports.error ? (
            <Alert>{reports.error}</Alert>
          ) : (
            <EvaluationReports
              key={tab}
              reports={shownReports}
              childName={name}
              nameFor={(report) =>
                report.role === "TEACHER"
                  ? fullName(user)
                  : (parentName ?? "Parent")
              }
              empty={
                tab === "PARENT"
                  ? "The parent's 6-week evaluations appear here after they answer."
                  : "Your 6-week evaluations appear here after you answer."
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
