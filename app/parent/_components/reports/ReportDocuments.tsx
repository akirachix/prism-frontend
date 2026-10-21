import { describeReport } from "@/lib/report-content";
import type { Plan, Recommendation, Report } from "@/lib/reports";
import { formatDate } from "@/lib/format";
import "./reports.css";

function Disclaimer() {
  return (
    <p className="preports__disclaimer">
      ⚠ This is a screening result, not a diagnosis.
    </p>
  );
}

export function ScreeningDocument({ report }: { report: Report }) {
  const sections = describeReport(report.content ?? {});
  return (
    <>
      <p className="preports__doc-meta">
        Prepared {formatDate(report.generated_at)}
      </p>
      {sections.length === 0 ? (
        <p className="preports__message">The results are not ready yet.</p>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="preports__doc-section">
            <h3 className="preports__doc-heading">{section.title}</h3>
            <dl className="preports__rows">
              {section.rows.map((row) => (
                <div key={row.label} className="preports__row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
      <Disclaimer />
    </>
  );
}

export function PlanDocument({ plan }: { plan: Plan }) {
  return (
    <>
      <p className="preports__doc-meta">
        Approved {formatDate(plan.approved_at)}
        {plan.evaluation_unlock_date &&
          ` · 6-week check opens ${formatDate(plan.evaluation_unlock_date)}`}
      </p>
      <section className="preports__doc-section">
        <h3 className="preports__doc-heading">The plan</h3>
        <p className="preports__text">{plan.generated_content}</p>
      </section>
      {plan.short_term_goals.length > 0 && (
        <section className="preports__doc-section">
          <h3 className="preports__doc-heading">Short-term goals</h3>
          <ul className="preports__goals">
            {plan.short_term_goals.map((goal, i) => (
              <li key={i}>
                <span
                  className={
                    i % 2
                      ? "preports__dot preports__dot--orange"
                      : "preports__dot"
                  }
                  aria-hidden="true"
                />
                {goal}
              </li>
            ))}
          </ul>
        </section>
      )}
      {plan.strategies.length > 0 && (
        <section className="preports__doc-section">
          <h3 className="preports__doc-heading">What the school will do</h3>
          <ul className="preports__list">
            {plan.strategies.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <Disclaimer />
    </>
  );
}

export function ActivitiesDocument({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <>
      <p className="preports__text">{recommendation.message}</p>
      <ol className="preports__activities">
        {recommendation.home_activities.map((activity, i) => (
          <li key={i} className="preports__card">
            <h3 className="preports__doc-heading">{activity.title}</h3>
            <ol className="preports__steps">
              {activity.steps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </>
  );
}
