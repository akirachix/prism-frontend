"use client";

import { useParams } from "next/navigation";

import EvaluationFlow from "@/app/_components/evaluation/EvaluationFlow";
import { useUser } from "@/app/_components/SessionProvider";
import { Alert, Empty, Loading, PageHeader } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { loadEvaluation } from "@/lib/evaluation-flow";
import { formatDay } from "@/lib/format";
import { currentIep, iepsApi } from "@/lib/ieps";
import { studentName, studentsApi } from "@/lib/lookups";
import "@/app/_components/portal.css";

async function load(caseId: string, teacherId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, ieps] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    iepsApi.list({ case_id: caseId }),
  ]);
  const iep = currentIep(ieps);
  const evaluation =
    iep?.status === "ACTIVE" ? await loadEvaluation(iep, teacherId) : null;
  return { student, iep, evaluation };
}

export default function TeacherCheckPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const { data, error, loading } = useLoad(
    () => load(caseId, user.user_id),
    [caseId, user.user_id],
  );

  return (
    <main className="ui-page">
      <PageHeader
        title="6-week check"
        eyebrow="My students"
        back={{
          href: data
            ? `/teacher/students/${data.student.student_id}`
            : "/teacher/students",
        }}
        tall
      />
      <div className="ui-body ui-body--narrow">
        {loading ? (
          <Loading />
        ) : error || !data ? (
          <Alert>{error ?? "We could not load the 6-week check."}</Alert>
        ) : (
          <>
            <div className="portal-student-card ui-lift">
              <strong>{studentName(data.student)}</strong>
              <span>
                {data.iep?.approved_at
                  ? `Plan approved ${formatDay(data.iep.approved_at)}`
                  : "Plan not approved yet"}
              </span>
            </div>
            {data.iep && data.evaluation ? (
              <EvaluationFlow
                role="TEACHER"
                iep={data.iep}
                data={data.evaluation}
                responderId={user.user_id}
                doneHref="/teacher/students"
                doneLabel="Back to my students"
                reviewHref="."
              />
            ) : (
              <Empty>The 6-week check starts after the plan is approved.</Empty>
            )}
          </>
        )}
      </div>
    </main>
  );
}
