"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import ReportViewer from "@/app/_components/report/ReportViewer";
import { Alert, Loading, PageHeader } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { studentsApi } from "@/lib/lookups";

export default function TeacherReportPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data, error, loading } = useLoad(async () => {
    const caseItem = await casesApi.get(caseId);
    return { caseItem, student: await studentsApi.get(caseItem.student_id) };
  }, [caseId]);

  return (
    <main className="ui-page">
      <PageHeader
        title="Reports"
        back={{
          href: data
            ? `/teacher/students/${data.student.student_id}`
            : "/teacher/students",
        }}
      />
      <div className="ui-body">
        {loading ? (
          <Loading />
        ) : error || !data ? (
          <Alert>{error ?? "We could not load the report."}</Alert>
        ) : (
          <Suspense fallback={<Loading />}>
            <ReportViewer
              kind="screening"
              child={data.student}
              caseId={caseId}
            />
            {data.caseItem.status !== "NO_CONCERN_IDENTIFIED" && (
              <ReportViewer
                kind="evaluation"
                child={data.student}
                caseId={caseId}
              />
            )}
          </Suspense>
        )}
      </div>
    </main>
  );
}
