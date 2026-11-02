import ReportsHeader from "./ReportsHeader";

/** What a reports page shows while the child's case loads, or if it fails. */
export default function ReportCaseState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <main className="preports">
      <ReportsHeader title={title} />
      <div className="preports__body">
        {error ? (
          <div className="preports__error-panel" role="alert">
            <p className="preports__error">
              We could not load your child&apos;s details: {error}
            </p>
            <button
              type="button"
              className="preports__button"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="preports__message">Loading reports…</p>
        )}
      </div>
    </main>
  );
}
