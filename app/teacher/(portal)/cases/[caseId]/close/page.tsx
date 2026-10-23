"use client";

import { useParams, useRouter } from "next/navigation";

import CloseCaseForm from "@/app/teacher/_components/cases/CloseCaseForm";
import { Alert, Loading, Note, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { logAudit } from "@/lib/audit";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import { studentName, studentsApi } from "@/lib/lookups";
import { FINISHED_STATUSES } from "@/lib/types";
import "@/_components/portal.css";
import "./close.css";

export default function CloseCasePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { data, error, loading } = useLoad(async () => {
    const caseItem = await casesApi.get(caseId);
    return { caseItem, student: await studentsApi.get(caseItem.student_id) };
  }, [caseId]);

  const studentHref = data
    ? `/teacher/students/${data.student.student_id}`
    : "/teacher/students";

  return (
    <main className="ui-page">
      <PageHeader
        title="Close this case"
        eyebrow={data ? studentName(data.student) : undefined}
        back={{ href: studentHref, label: "Back to the student" }}
        tall
      />
      <div className="ui-body ui-body--narrow">
        {loading ? (
          <Loading />
        ) : error || !data ? (
          <Alert>{error ?? "We could not load this case."}</Alert>
        ) : (
          <>
            <div className="portal-student-card ui-lift">
              <strong>{studentName(data.student)}</strong>
              <span>Case started {formatDay(data.caseItem.created_at)}</span>
            </div>
            {FINISHED_STATUSES.includes(data.caseItem.status) ? (
              <Alert tone="info">This case is already finished.</Alert>
            ) : (
              <div className="ui-card close-page">
                <CloseCaseForm
                  caseId={caseId}
                  cancelLabel="Cancel"
                  onCancel={() => router.push(studentHref)}
                  onClosed={() => {
                    logAudit("UPDATE", "case", caseId, { action: "close" });
                    router.push(studentHref);
                  }}
                />
                <Note>
                  Closing ends this case. You can start a new case later.
                </Note>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
