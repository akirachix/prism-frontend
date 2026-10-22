"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import ScreeningFlow from "@/app/_components/screening/ScreeningFlow";
import { useUser } from "@/app/_components/SessionProvider";
import { Alert, Loading, PageHeader } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { ageInYears, studentName, studentsApi } from "@/lib/lookups";
import { loadScreening } from "@/lib/screening";
import { questionSetFor } from "@/lib/screening-questions";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, screening] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    loadScreening(caseId),
  ]);
  return { caseItem, student, screening: screening.content };
}

export default function TeacherScreeningPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const router = useRouter();
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);
  const finished = Boolean(data?.screening.teacher?.completed_at);

  useEffect(() => {
    if (finished) router.replace(`/teacher/cases/${caseId}/screening/done`);
  }, [finished, caseId, router]);

  if (loading || finished) return <Loading />;
  if (error || !data) {
    return (
      <main className="ui-page">
        <PageHeader title="Screening" back={{ href: "/teacher/students" }} />
        <div className="ui-body">
          <Alert>{error ?? "We could not open this screening."}</Alert>
        </div>
      </main>
    );
  }

  const exitHref = `/teacher/students/${data.student.student_id}`;
  return (
    <ScreeningFlow
      role="TEACHER"
      caseItem={data.caseItem}
      set={questionSetFor(ageInYears(data.student.date_of_birth))}
      saved={data.screening}
      responderId={user.user_id}
      title={studentName(data.student)}
      exitHref={exitHref}
      doneHref={`/teacher/cases/${caseId}/screening/done`}
    />
  );
}
