"use client";

import { Check } from "lucide-react";

import { ButtonLink } from "@/_components/ui/Button";
import {
  Alert,
  Disclaimer,
  IconBadge,
  Loading,
  PageHeader,
} from "@/_components/ui/bits";
import ScreeningUnavailable from "@/_components/screening/ScreeningUnavailable";
import { useLoad } from "@/_components/useLoad";
import { SCREENING_ENABLED } from "@/lib/features";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import {
  scoreIfWaitIsOver,
  screeningApi,
  screeningOutcome,
  soloScoringDate,
  stageFor,
} from "@/lib/screening";
import { useChild } from "../../../_components/ChildProvider";
import "@/_components/portal.css";
import "@/_components/screening/screening.css";

async function load(caseId: string) {
  let caseItem = await casesApi.get(caseId);
  const assessments = await screeningApi.assessments(caseId);
  // The teacher had 7 days: the backend may now score the parent's answers alone.
  if (
    await scoreIfWaitIsOver(caseId, assessments, caseItem.domain_density_score)
  ) {
    caseItem = await casesApi.get(caseId);
  }
  return { caseItem, assessments };
}

function ParentScreeningDone() {
  const { caseItem: current, loading: childLoading } = useChild();
  const caseId = current?.case_id ?? null;
  const { data, error, loading } = useLoad(
    () => (caseId ? load(caseId) : Promise.resolve(null)),
    [caseId],
  );

  const outcome = data
    ? screeningOutcome(data.caseItem.status, data.caseItem.domain_density_score)
    : "pending";
  const waiting = data
    ? stageFor(data.assessments, "PARENT") === "waiting_for_other"
    : false;
  const scoringDate = data ? soloScoringDate(data.assessments) : null;

  return (
    <main className="ui-page">
      <PageHeader
        title="Screening completed"
        back={{ href: "/parent", label: "Home" }}
      />
      <div className="ui-body screening-page ui-body--center">
        {childLoading || loading ? (
          <Loading />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : (
          <section
            className="portal-result portal-result--plain"
            aria-live="polite"
          >
            <IconBadge>
              <Check size={40} strokeWidth={2} />
            </IconBadge>
            <h2 className="portal-result__title portal-result__title--big">
              Screening completed!
            </h2>
            <p>
              Thank you for completing the screening. Your answers have been
              saved.
            </p>
            {outcome === "no_concern" && (
              <p>
                The screening found no concern. You can read the screening
                report in Reports.
              </p>
            )}
            {outcome === "plan" && (
              <p>
                The answers showed something worth supporting. In Reports you
                will find the screening report, the education plan (IEP) and
                home activities as soon as they are ready, and specialists you
                can reach.
              </p>
            )}
            {outcome === "pending" && waiting && (
              <p>
                We are waiting for the teacher&apos;s answers.
                {scoringDate &&
                  ` If they have not answered by ${formatDay(scoringDate.toISOString())}, the result will be worked out from your answers.`}
              </p>
            )}
            <Disclaimer>This is a screening result, not a diagnosis</Disclaimer>
            <div className="ui-actions portal-result__actions">
              <ButtonLink href="/parent/reports">View reports</ButtonLink>
              <ButtonLink href="/parent" variant="outline">
                Back to dashboard
              </ButtonLink>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function ParentScreeningDonePage() {
  if (!SCREENING_ENABLED) {
    return <ScreeningUnavailable backHref="/parent" backLabel="Home" />;
  }
  return <ParentScreeningDone />;
}
