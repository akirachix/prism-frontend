"use client";

import { CircleCheck, Hourglass, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";

import { ButtonLink } from "@/_components/ui/Button";
import { Alert, Disclaimer, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { studentName, studentsApi } from "@/lib/lookups";
import { loadScreening } from "@/lib/screening";
import "@/_components/portal.css";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, screening] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    loadScreening(caseId),
  ]);
  return { caseItem, student, screening: screening.content };
}

export default function ScreeningDonePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);

  const header = (
    <PageHeader
      title="Screening finished"
      eyebrow="My students"
      back={{ href: "/teacher/cases", label: "My students" }}
      tall
    />
  );

  if (loading)
    return (
      <main className="ui-page">
        {header}
        <Loading />
      </main>
    );
  if (error || !data) {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body">
          <Alert>{error ?? "We could not load the result."}</Alert>
        </div>
      </main>
    );
  }

  const { caseItem, student, screening } = data;
  const noConcern = caseItem.status === "NO_CONCERN_IDENTIFIED";
  const bothDone = Boolean(screening.combined);

  return (
    <main className="ui-page">
      {header}
      <div className="ui-body ui-body--narrow">
        <div className="portal-student-card ui-lift">
          <strong>{studentName(student)}</strong>
          <span>Adm. {student.admission_number}</span>
        </div>

        <section className="portal-result" aria-live="polite">
          {noConcern ? (
            <>
              <CircleCheck size={48} aria-hidden="true" />
              <h2 className="portal-result__title">No concern identified</h2>
              <p>The screening raised no concern, no IEP is needed now.</p>
              <p>
                The case is closed. If you notice something later, you can start
                a new case.
              </p>
            </>
          ) : bothDone ? (
            <>
              <Sparkles size={48} aria-hidden="true" />
              <h2 className="portal-result__title">Both screenings are done</h2>
              <p>
                The answers showed something worth supporting. A plan (IEP) is
                being prepared for you to review. We will let you know when it
                is ready.
              </p>
            </>
          ) : (
            <>
              <Hourglass size={48} aria-hidden="true" />
              <h2 className="portal-result__title">
                Thank you, your part is done
              </h2>
              <p>
                We are waiting for the parent&apos;s screening. When both are
                in, you will see the result here.
              </p>
            </>
          )}
          <Disclaimer>This is a screening result, not a diagnosis</Disclaimer>
        </section>

        <div className="ui-actions">
          <ButtonLink href="/teacher/cases" variant="orange">
            Back to my students
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
