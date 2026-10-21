"use client";

import EvaluationFlow from "@/_components/evaluation/EvaluationFlow";
import { useUser } from "@/_components/SessionProvider";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { loadEvaluation, planForCase } from "@/lib/evaluation-flow";
import { useChild } from "../../_components/ChildProvider";

export default function ParentEvaluationPage() {
  const user = useUser();
  const { caseItem, loading: childLoading } = useChild();
  const caseId = caseItem?.case_id ?? null;
  const { data, error, loading } = useLoad(async () => {
    if (!caseId) return null;
    const iep = await planForCase(caseId);
    if (!iep || iep.status !== "ACTIVE") return null;
    return { iep, evaluation: await loadEvaluation(iep, user.user_id) };
  }, [caseId, user.user_id]);

  return (
    <main className="ui-page">
      <PageHeader
        title="Your evaluation"
        back={{ href: "/parent", label: "Home" }}
      />
      <div className="ui-body ui-body--narrow">
        {childLoading || loading ? (
          <Loading />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : !data ? (
          <Empty>
            The evaluation opens six weeks after your child&apos;s plan is
            approved. We will let you know when it is ready.
          </Empty>
        ) : (
          <EvaluationFlow
            role="PARENT"
            iep={data.iep}
            data={data.evaluation}
            responderId={user.user_id}
            doneHref="/parent"
            doneLabel="Back to dashboard"
            reviewHref="."
          />
        )}
      </div>
    </main>
  );
}
