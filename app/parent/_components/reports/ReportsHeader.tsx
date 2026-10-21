import Link from "next/link";

import "./reports.css";

/** The navy header from the parent designs, with an optional back link. */
export default function ReportsHeader({
  title,
  back,
}: {
  title: string;
  back?: string;
}) {
  return (
    <header className="preports__header no-print">
      {back && (
        <Link
          href={back}
          className="preports__back"
          aria-label="Back to reports"
        >
          ← <span>Reports</span>
        </Link>
      )}
      <h1 className="preports__title">{title}</h1>
    </header>
  );
}
