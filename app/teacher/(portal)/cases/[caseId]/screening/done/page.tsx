"use client";

import { CircleCheck, Hourglass, NotebookPen } from "lucide-react";
import { useParams } from "next/navigation";

import { ButtonLink } from "@/_components/ui/Button";
import { Alert, Disclaimer, Loading, PageHeader } from "@/_components/ui/bits";
import ScreeningUnavailable from "@/_components/screening/ScreeningUnavailable";
import { useLoad } from "@/_components/useLoad";
import { SCREENING_ENABLED } from "@/lib/features";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import { studentName, studentsApi } from "@/lib/lookups";
import {
  scoreIfWaitIsOver,
  screeningApi,
  screeningOutcome,
  soloScoringDate,
  screeningIsOpen,
  stageFor,
} from "@/lib/screening";
import "@/_components/portal.css";
import "@/_components/screening/screening.css";

async function load(caseId: string) {
  let caseItem = await casesApi.get(caseId);
  const [student, assessments] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    screeningApi.assessments(caseId),
  ]);
  // The parent had 7 days: the backend may now score the teacher's answers alone.
  if (
    await scoreIfWaitIsOver(caseId, assessments, caseItem.domain_density_score)
  ) {
    caseItem = await casesApi.get(caseId);
  }
  return { caseItem, student, assessments };
}

function TeacherScreeningDone() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);

  const studentHref = data
    ? `/teacher/students/${data.student.student_id}`
    : "/teacher/students";
  const header = (
    <PageHeader
      title="Screening finished"
      eyebrow="My students"
      back={{ href: studentHref, label: "Student" }}
      tall
    />
  );

  if (loading) {
    return (
      <main className="ui-page">
        {header}
        <Loading />
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page">
          <Alert>{error ?? "We could not load the result."}</Alert>
        </div>
      </main>
    );
  }

  const { caseItem, student, assessments } = data;
  const outcome = screeningOutcome(
    caseItem.status,
    caseItem.domain_density_score,
  );
  const stage = stageFor(assessments, "TEACHER");
  // Once the case is scored the screening is over, even for an unfinished part.
  const canContinue =
    screeningIsOpen(caseItem) &&
    (stage === "in_progress" || stage === "not_started");
  const scoringDate = soloScoringDate(assessments);

  return (
    <main className="ui-page">
      {header}
      <div className="ui-body screening-page">
        <div className="portal-student-card ui-lift">
          <strong>{studentName(student)}</strong>
          <span>Adm. {student.admission_number}</span>
        </div>

        <section className="portal-result" aria-live="polite">
          {outcome === "no_concern" ? (
            <>
              <CircleCheck size={48} aria-hidden="true" />
              <h2 className="portal-result__title">No concern identified</h2>
              <p>The screening raised no concern, so no IEP is needed now.</p>
              <p>If you notice something later, you can start a new case.</p>
            </>
          ) : outcome === "plan" ? (
            <>
              <NotebookPen size={48} aria-hidden="true" />
              <h2 className="portal-result__title">An IEP is being prepared</h2>
              <p>
                The answers showed something worth supporting. The plan (IEP)
                will be ready for you to review and approve.
              </p>
            </>
          ) : (
            <>
              <Hourglass size={48} aria-hidden="true" />
              <h2 className="portal-result__title">
                {canContinue
                  ? "Your screening is not finished"
                  : "Thank you, your part is done"}
              </h2>
              {stage === "waiting_for_other" && (
                <p>
                  We are waiting for the parent&apos;s screening.
                  {scoringDate &&
                    ` If they have not answered by ${formatDay(scoringDate.toISOString())}, the result will be worked out from your answers.`}
                </p>
              )}
            </>
          )}
          <Disclaimer>This is a screening result, not a diagnosis</Disclaimer>
        </section>

        <div className="ui-actions">
          {outcome === "plan" && (
            <ButtonLink href={`/teacher/cases/${caseId}/plan`}>
              View the plan
            </ButtonLink>
          )}
          {canContinue && (
            <ButtonLink href={`/teacher/cases/${caseId}/screening`}>
              Continue my screening
            </ButtonLink>
          )}
          <ButtonLink href={studentHref} variant="outline">
            Back to the student
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

export default function ScreeningDonePage() {
  if (!SCREENING_ENABLED) {
    return (
      <ScreeningUnavailable
        backHref="/teacher/students"
        backLabel="Back to my students"
      />
    );
  }
  return <TeacherScreeningDone />;
}
