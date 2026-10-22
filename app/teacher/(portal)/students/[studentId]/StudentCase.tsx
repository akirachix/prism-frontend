"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { orNull, useLoad } from "@/app/_components/useLoad";
import { useUser } from "@/app/_components/SessionProvider";
import Button, { ButtonLink } from "@/app/_components/ui/Button";
import Journey from "@/app/_components/journey/Journey";
import {
  Alert,
  Avatar,
  Loading,
  PageHeader,
  Pill,
} from "@/app/_components/ui/bits";
import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { casesApi, latestCase } from "@/lib/cases";
import { formatDay, labelOf } from "@/lib/format";
import { currentIep, evaluationIsOpen, iepsApi, type IEP } from "@/lib/ieps";
import { journeyFor } from "@/lib/journey";
import { studentName, studentsApi } from "@/lib/lookups";
import { loadScreening, type ScreeningContent } from "@/lib/screening";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import { fullName, hasSignedIn, usersApi } from "@/lib/users";
import "@/app/_components/portal.css";
import "./student-case.css";

async function loadStudentCase(studentId: string) {
  const [student, cases] = await Promise.all([
    studentsApi.get(studentId),
    casesApi.listBy({ student_id: studentId }),
  ]);
  const caseItem = latestCase(cases);
  const [screening, ieps, parent] = await Promise.all([
    caseItem ? loadScreening(caseItem.case_id).then((r) => r.content) : null,
    caseItem ? iepsApi.list({ case_id: caseItem.case_id }) : [],
    student.parent_id ? orNull(usersApi.get(student.parent_id)) : null,
  ]);
  logAudit("VIEW", "student", studentId);
  return { student, caseItem, screening, iep: currentIep(ieps), parent };
}

function nextStep(
  caseItem: Case,
  screening: ScreeningContent | null,
  iep: IEP | null,
): { label: string; href: string } | null {
  const base = `/teacher/cases/${caseItem.case_id}`;
  if (caseItem.status === "NO_CONCERN_IDENTIFIED") {
    return { label: "See the result", href: `${base}/screening/done` };
  }
  if (FINISHED_STATUSES.includes(caseItem.status)) return null;
  if (!screening?.teacher?.completed_at) {
    return {
      label: screening?.teacher
        ? "Continue my screening"
        : "Start my screening",
      href: `${base}/screening`,
    };
  }
  if (
    iep?.status === "PENDING_APPROVAL" ||
    iep?.status === "DRAFT" ||
    iep?.status === "REJECTED"
  ) {
    return { label: "Review the plan", href: `${base}/plan` };
  }
  if (iep?.status === "ACTIVE") {
    return evaluationIsOpen(iep)
      ? { label: "Start the 6-week check", href: `${base}/check` }
      : { label: "View the plan", href: `${base}/plan` };
  }
  return null;
}

export default function StudentCase() {
  const { studentId } = useParams<{ studentId: string }>();
  const user = useUser();
  const { data, error, loading, reload } = useLoad(
    () => loadStudentCase(studentId),
    [studentId],
  );
  const [busy, setBusy] = useState<"start" | "invite" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);

  if (loading && !data) {
    return (
      <main className="ui-page">
        <PageHeader
          title="Student"
          back={{ href: "/teacher/students", label: "My students" }}
        />
        <Loading />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="ui-page">
        <PageHeader
          title="Student"
          back={{ href: "/teacher/students", label: "My students" }}
        />
        <div className="ui-body">
          <Alert>{error ?? "We could not find this student."}</Alert>
        </div>
      </main>
    );
  }

  const { student, caseItem, screening, iep, parent } = data;
  const name = studentName(student);
  const open = caseItem && !FINISHED_STATUSES.includes(caseItem.status);
  const steps = caseItem ? journeyFor(caseItem, screening, iep, "TEACHER") : [];
  const step = caseItem ? nextStep(caseItem, screening, iep) : null;

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
    if (!parent) return;
    setBusy("invite");
    setActionError(null);
    try {
      await usersApi.resendInvitation(parent.user_id);
      setInvited(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const tiles = caseItem
    ? [
        {
          label: "Case status",
          value: open
            ? `Started ${formatDay(caseItem.created_at)}`
            : labelOf(caseItem.status),
        },
        { label: "Your screening", value: steps[1]?.note ?? "—" },
        { label: "Parent’s screening", value: steps[2]?.note ?? "—" },
      ]
    : [];

  return (
    <main className="ui-page">
      <PageHeader
        title={name}
        tall
        back={{ href: "/teacher/students", label: "Back to my students" }}
        eyebrow="Back"
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

      <div className="ui-body student-case">
        <section
          className="ui-card ui-lift student-case__parent"
          aria-label="Parent"
        >
          <Avatar name={name} id={student.student_id} size={56} />
          <div className="student-case__parent-text">
            <span className="student-case__parent-name">
              Parent: {parent ? fullName(parent) : "Not linked yet"}
            </span>
            {parent && (
              <Pill tone={hasSignedIn(parent) ? "blush" : "outline"}>
                {hasSignedIn(parent) ? "Signed in" : "Not signed in yet"}
              </Pill>
            )}
          </div>
          {parent && !hasSignedIn(parent) && (
            <Button
              variant="outline"
              small
              onClick={resendInvite}
              loading={busy === "invite"}
            >
              {invited ? "Invite sent" : "Resend invite"}
            </Button>
          )}
        </section>

        {actionError && <Alert>{actionError}</Alert>}

        {!caseItem ? (
          <div className="ui-card student-case__empty">
            <h2 className="ui-section-title">No case yet</h2>
            <p className="ui-text">
              Start a case when you have noticed a concern that has lasted for a
              few weeks. You and the parent will each answer a short screening.
            </p>
            <Button onClick={startCase} loading={busy === "start"}>
              Start a case
            </Button>
          </div>
        ) : (
          <>
            <div className="student-case__tiles">
              {tiles.map((tile) => (
                <div key={tile.label} className="student-case__tile">
                  <span className="student-case__tile-label">{tile.label}</span>
                  <Pill tone="sky">{tile.value}</Pill>
                </div>
              ))}
            </div>

            <section
              className="ui-card student-case__journey"
              aria-labelledby="journey-title"
            >
              <h2 id="journey-title" className="ui-section-title">
                {student.first_name}&apos;s journey
              </h2>
              <Journey steps={steps} />
            </section>

            {!iep && open && (
              <p className="student-case__locked">
                <Lock size={20} aria-hidden="true" />
                <span>
                  <strong>Plan (IEP):</strong> unlocks when the two screenings
                  identify a concern.
                </span>
              </p>
            )}

            {caseItem.status === "CLOSED" && (
              <Alert tone="info">
                This case was closed. Reason: {caseItem.closed_reason ?? "—"}
              </Alert>
            )}

            <div className="ui-actions student-case__cta">
              {step && <ButtonLink href={step.href}>{step.label}</ButtonLink>}
              {!open && (
                <Button
                  variant="outline"
                  onClick={startCase}
                  loading={busy === "start"}
                >
                  Start a new case
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
