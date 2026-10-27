"use client";

import { Download } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import "@/_components/plan/plan.css";
import { useUser } from "@/_components/SessionProvider";
import Button from "@/_components/ui/Button";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { orNull, useLoad } from "@/_components/useLoad";
import { logAudit } from "@/lib/audit";
import { casesApi } from "@/lib/cases";
import { canDownload, currentIep, plansForCase } from "@/lib/ieps";
import { studentName, studentsApi } from "@/lib/lookups";
import { schoolsApi } from "@/lib/schools";
import "@/_components/portal.css";

function longDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", { dateStyle: "long" });
}

async function load(caseId: string, schoolId: string | null) {
  const caseItem = await casesApi.get(caseId);
  const [student, ieps, school] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    plansForCase(caseId),
    schoolId ? orNull(schoolsApi.get(schoolId)) : Promise.resolve(null),
  ]);
  return { student, iep: currentIep(ieps), school };
}

export default function PlanPrintPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const { data, error, loading } = useLoad(
    () => load(caseId, user.school_id ?? null),
    [caseId, user.school_id],
  );
  const printed = useRef(false);
  const ready = Boolean(data && canDownload(data.iep));

  useEffect(() => {
    if (!ready || printed.current || !data?.iep) return;
    printed.current = true;
    logAudit("EXPORT", "iep", data.iep.iep_id, { format: "pdf" });
    setTimeout(() => window.print(), 300);
  }, [ready, data]);

  const back = `/teacher/cases/${caseId}/plan`;

  return (
    <main className="ui-page plan-print-page">
      <PageHeader
        title="Download the plan"
        eyebrow="Plan"
        back={{ href: back, label: "Back to the plan" }}
      />
      <div className="ui-body">
        {loading ? (
          <Loading />
        ) : error || !data ? (
          <Alert>{error ?? "We could not load the plan."}</Alert>
        ) : !data.iep || !canDownload(data.iep) ? (
          <Empty>
            The plan can be downloaded once you and the school admin have both
            approved it.
          </Empty>
        ) : (
          <>
            <div className="ui-actions no-print">
              <Button onClick={() => window.print()}>
                <Download size={18} aria-hidden="true" /> Save as PDF
              </Button>
              <p className="plan-approval__note">
                In the print window, choose “Save as PDF” as the printer.
              </p>
            </div>

            <article className="plan-print">
              <header className="plan-print__head">
                <div>
                  <div className="plan-print__brand">mirai</div>
                  <div>{data.school?.name ?? ""}</div>
                </div>
                <div>
                  <strong>Education Plan (IEP)</strong>
                  <div>Version {data.iep.version_number}</div>
                </div>
              </header>

              <dl className="plan-print__facts">
                <div>
                  <dt>Child</dt>
                  <dd>{studentName(data.student)}</dd>
                </div>
                <div>
                  <dt>Admission number</dt>
                  <dd>{data.student.admission_number}</dd>
                </div>
                <div>
                  <dt>Approved by the teacher and the school</dt>
                  <dd>{longDate(data.iep.approved_at)}</dd>
                </div>
                <div>
                  <dt>6-week check</dt>
                  <dd>{longDate(data.iep.evaluation_unlock_date)}</dd>
                </div>
              </dl>

              <section>
                <h2>The plan</h2>
                <p>{data.iep.generated_content.trim()}</p>
              </section>

              {data.iep.short_term_goals.length > 0 && (
                <section>
                  <h2>Short-term goals</h2>
                  <ul>
                    {data.iep.short_term_goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </section>
              )}

              {data.iep.strategies.length > 0 && (
                <section>
                  <h2>In class</h2>
                  <ul>
                    {data.iep.strategies.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="plan-print__foot">
                This plan supports the child at school. It is not a diagnosis.
                Downloaded {longDate(new Date().toISOString())}.
              </footer>
            </article>
          </>
        )}
      </div>
    </main>
  );
}
