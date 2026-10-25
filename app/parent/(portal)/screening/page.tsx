"use client";

import ScreeningJourney from "@/_components/screening/ScreeningJourney";
import ScreeningUnavailable from "@/_components/screening/ScreeningUnavailable";
import { useUser } from "@/_components/SessionProvider";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { casesApi } from "@/lib/cases";
import { SCREENING_ENABLED } from "@/lib/features";
import { loadMyScreening, screeningIsOpen } from "@/lib/screening";
import { useChild } from "../../_components/ChildProvider";

function ParentScreening() {
  const user = useUser();
  const {
    child,
    caseItem,
    loading: childLoading,
    error: childError,
  } = useChild();
  const caseId = caseItem?.case_id ?? null;
  const screening = useLoad(
    () =>
      caseId
        ? Promise.all([
            loadMyScreening(caseId, "PARENT"),
            casesApi.get(caseId),
          ]).then(([mine, current]) => ({ mine, current }))
        : Promise.resolve(null),
    [caseId],
  );

  if (childLoading || screening.loading) return <Loading />;

  const error = childError ?? screening.error;
  const data = screening.data;
  const canAnswer =
    data &&
    (data.mine.assessment?.completed_at || screeningIsOpen(data.current));

  if (error || !child || !caseId || !data || !canAnswer) {
    return (
      <main className="ui-page">
        <PageHeader
          title="Screening"
          back={{ href: "/parent", label: "Home" }}
        />
        <div className="ui-body">
          {error ? (
            <Alert>{error}</Alert>
          ) : (
            <Empty>There is no screening for you to answer right now.</Empty>
          )}
        </div>
      </main>
    );
  }

  return (
    <ScreeningJourney
      role="PARENT"
      caseId={caseId}
      responderId={user.user_id}
      childName={child.first_name}
      initial={data.mine}
      exitHref="/parent"
      exitLabel="Home"
      doneHref="/parent/screening/done"
    />
  );
}

export default function ParentScreeningPage() {
  if (!SCREENING_ENABLED) {
    return <ScreeningUnavailable backHref="/parent" backLabel="Home" />;
  }
  return <ParentScreening />;
}
