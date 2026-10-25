"use client";

import EvaluationFlow from "@/_components/evaluation/EvaluationFlow";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { loadEvaluation, planForCase } from "@/lib/evaluation-flow";
import { useChild } from "../../_components/ChildProvider";
import "@/_components/portal.css";
import "@/_components/evaluation/evaluation.css";

async function load(caseId: string | null) {
  if (!caseId) return null;
  const iep = await planForCase(caseId);
  if (!iep || iep.status !== "ACTIVE") return { iep, evaluation: null };
  return { iep, evaluation: await loadEvaluation(iep) };
}

export default function ParentEvaluationPage() {
  const { child, caseItem, loading: childLoading } = useChild();
  const caseId = caseItem?.case_id ?? null;
  const { data, error, loading } = useLoad(() => load(caseId), [caseId]);

  return (
    <main className="ui-page">
      <PageHeader
        title="Your evaluation"
        back={{ href: "/parent", label: "Home" }}
      />
      <div className="ui-body evaluation-page">
        {childLoading || (loading && !data) ? (
          <Loading />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : !child ? (
          <Empty>Your account is not linked to a child yet.</Empty>
        ) : !data?.iep || !data.evaluation ? (
          <Empty>
            The evaluation opens six weeks after your child&apos;s plan is
            approved by the school administrator and the teacher. We will let
            you know on your home page when it is ready.
          </Empty>
        ) : (
          <EvaluationFlow
            role="PARENT"
            iep={data.iep}
            data={data.evaluation}
            childName={child.first_name}
            doneHref="/parent"
            doneLabel="Back to home"
          />
        )}
      </div>
    </main>
  );
}
