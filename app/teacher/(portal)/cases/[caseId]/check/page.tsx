"use client";

import { useParams } from "next/navigation";

import EvaluationFlow from "@/_components/evaluation/EvaluationFlow";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { loadEvaluation, planForCase } from "@/lib/evaluation-flow";
import { formatLongDay } from "@/lib/format";
import { studentName, studentsApi } from "@/lib/lookups";
import "@/_components/portal.css";
import "@/_components/evaluation/evaluation.css";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, iep] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    planForCase(caseId),
  ]);
  const evaluation =
    iep?.status === "ACTIVE" ? await loadEvaluation(iep) : null;
  return { student, iep, evaluation };
}

export default function TeacherCheckPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);
  const profileHref = data
    ? `/teacher/students/${data.student.student_id}`
    : "/teacher/students";

  return (
    <main className="ui-page">
      <PageHeader
        title="6-week check"
        eyebrow="Student"
        back={{ href: profileHref, label: "Back to the student" }}
      />
      <div className="ui-body evaluation-page">
        {loading && !data ? (
          <Loading />
        ) : error || !data ? (
          <Alert>{error ?? "We could not load the 6-week check."}</Alert>
        ) : (
          <>
            <div className="portal-student-card">
              <strong>{studentName(data.student)}</strong>
              <span>
                {data.iep?.approved_at
                  ? `Plan approved ${formatLongDay(data.iep.approved_at)}`
                  : "Plan not approved yet"}
              </span>
            </div>
            {data.iep && data.evaluation ? (
              <EvaluationFlow
                role="TEACHER"
                iep={data.iep}
                data={data.evaluation}
                childName={data.student.first_name}
                doneHref={profileHref}
                doneLabel="Back to the student"
              />
            ) : (
              <Empty>
                The 6-week check opens six weeks after the plan is approved by
                the school administrator and you.
              </Empty>
            )}
          </>
        )}
      </div>
    </main>
  );
}
