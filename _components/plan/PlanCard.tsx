import { Download } from "lucide-react";

import { ButtonLink } from "@/_components/ui/Button";
import { Pill, ProgressBar } from "@/_components/ui/bits";
import { formatDay } from "@/lib/format";
import {
  canDownload,
  evaluationIsOpen,
  planState,
  planWeek,
  weeksElapsed,
  type IEP,
} from "@/lib/ieps";
import "./plan.css";

export default function PlanCard({
  caseId,
  iep,
}: {
  caseId: string;
  iep: IEP;
}) {
  const base = `/teacher/cases/${caseId}/plan`;
  const state = planState(iep);
  const active = iep.status === "ACTIVE";
  const checkOpen = evaluationIsOpen(iep);
  const weeks = weeksElapsed(iep);
  const goals = iep.short_term_goals.slice(0, 2);

  const note = active
    ? `Version ${iep.version_number} · approved by you and the school on ${formatDay(iep.approved_at)}`
    : iep.status === "REJECTED"
      ? "You asked the AI for a new version."
      : iep.teacher_approved
        ? "You approved it. Waiting for the school admin."
        : `Version ${iep.version_number} is ready for you to read and approve.`;

  return (
    <section className="ui-card plan-card" aria-labelledby="plan-card-title">
      <div className="plan-card__head">
        <h2 id="plan-card-title" className="ui-section-title">
          Education plan (IEP)
        </h2>
        <Pill tone={state.tone}>{state.label}</Pill>
      </div>
      <p className="plan-approval__note">{note}</p>

      {active && (
        <div className="plan-card__weeks">
          <ProgressBar
            value={planWeek(iep)}
            max={weeks.total}
            tone={checkOpen ? "orange" : "red"}
            label="Weeks since the plan started"
          />
          <span>
            {checkOpen
              ? "The 6-week check is open"
              : `Week ${planWeek(iep)} of ${weeks.total}`}
          </span>
        </div>
      )}

      {goals.length > 0 && (
        <div>
          <strong className="plan-card__label">Goals</strong>
          <ul className="plan__list">
            {goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="ui-actions plan-card__actions">
        {active && checkOpen && (
          <ButtonLink href={`/teacher/cases/${caseId}/check`}>
            Start the 6-week check
          </ButtonLink>
        )}
        <ButtonLink
          href={base}
          variant={state.waitingForMe && !active ? "primary" : "outline"}
        >
          {state.waitingForMe && !active
            ? "Review the plan"
            : "Open the full plan"}
        </ButtonLink>
        {canDownload(iep) && (
          <ButtonLink href={`${base}/print`} variant="outline">
            <Download size={18} aria-hidden="true" /> Download PDF
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
