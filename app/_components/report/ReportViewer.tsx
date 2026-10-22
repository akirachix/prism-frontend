"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { logAudit } from "@/lib/audit";
import type { Student } from "@/lib/lookups";
import {
  loadEvaluationReport,
  loadScreeningReport,
  type EvaluationReport,
} from "@/lib/report-data";
import type { ScreeningContent } from "@/lib/screening";
import { useLoad } from "../useLoad";
import Button from "../ui/Button";
import { Alert, Empty, Loading } from "../ui/bits";
import { EvaluationReportDoc, ScreeningReport } from "./ReportDocument";

function exportPdf(kind: string, caseId: string) {
  logAudit("EXPORT", `${kind}_report`, caseId);
  window.print();
}

/** Loads one report, shows it, and prints it to PDF on request. */
export default function ReportViewer({
  kind,
  child,
  caseId,
}: {
  kind: "screening" | "evaluation";
  child: Student;
  caseId: string;
}) {
  const params = useSearchParams();
  const autoPrint = params.get("print") === "1";
  const printed = useRef(false);
  const { data, error, loading } = useLoad<{
    content: ScreeningContent | null;
    evaluation: EvaluationReport | null;
  }>(
    () =>
      kind === "screening"
        ? loadScreeningReport(caseId).then((content) => ({
            content,
            evaluation: null,
          }))
        : loadEvaluationReport(caseId).then((evaluation) => ({
            content: null,
            evaluation,
          })),
    [kind, caseId],
  );
  const ready = Boolean(data?.content || data?.evaluation);

  useEffect(() => {
    if (autoPrint && ready && !printed.current) {
      printed.current = true;
      // Let the page paint before the print dialog opens.
      setTimeout(() => exportPdf(kind, caseId), 300);
    }
  }, [autoPrint, ready, kind, caseId]);

  if (loading) return <Loading />;
  if (error) return <Alert>{error}</Alert>;
  if (!ready) {
    return (
      <Empty>
        {kind === "screening"
          ? "The screening report is ready once the screening has started."
          : "The evaluation report is ready after the 6-week check."}
      </Empty>
    );
  }

  return (
    <>
      <div className="ui-actions ui-actions--end no-print">
        <Button onClick={() => exportPdf(kind, caseId)}>
          <Download size={18} aria-hidden="true" /> Download PDF
        </Button>
      </div>
      {data?.content && (
        <ScreeningReport child={child} content={data.content} />
      )}
      {data?.evaluation && (
        <EvaluationReportDoc child={child} report={data.evaluation} />
      )}
    </>
  );
}
