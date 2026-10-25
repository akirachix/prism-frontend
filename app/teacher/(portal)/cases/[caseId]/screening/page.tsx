"use client";

import { useParams } from "next/navigation";

import ScreeningJourney from "@/_components/screening/ScreeningJourney";
import ScreeningUnavailable from "@/_components/screening/ScreeningUnavailable";
import { useUser } from "@/_components/SessionProvider";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { SCREENING_ENABLED } from "@/lib/features";
import { studentName, studentsApi } from "@/lib/lookups";
import { loadMyScreening, screeningIsOpen } from "@/lib/screening";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, mine] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    loadMyScreening(caseId, "TEACHER"),
  ]);
  return { caseItem, student, mine };
}

function TeacherScreening() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);

  if (loading) return <Loading />;

  const exitHref = data
    ? `/teacher/students/${data.student.student_id}`
    : "/teacher/students";
  const closed =
    data &&
    !data.mine.assessment?.completed_at &&
    !screeningIsOpen(data.caseItem);

  if (error || !data || closed) {
    return (
      <main className="ui-page">
        <PageHeader
          title="Screening"
          back={{ href: exitHref, label: "Back to the student" }}
        />
        <div className="ui-body">
          {error || !data ? (
            <Alert>{error ?? "We could not open this screening."}</Alert>
          ) : (
            <Empty>
              The screening for this case is closed, so there is nothing to
              answer.
            </Empty>
          )}
        </div>
      </main>
    );
  }

  return (
    <ScreeningJourney
      role="TEACHER"
      caseId={caseId}
      responderId={user.user_id}
      childName={studentName(data.student)}
      initial={data.mine}
      exitHref={exitHref}
      exitLabel="Back to the student"
      doneHref={`/teacher/cases/${caseId}/screening/done`}
    />
  );
}

export default function TeacherScreeningPage() {
  if (!SCREENING_ENABLED) {
    return (
      <ScreeningUnavailable
        backHref="/teacher/students"
        backLabel="Back to my students"
      />
    );
  }
  return <TeacherScreening />;
}
