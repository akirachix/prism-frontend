import { Suspense } from "react";

import ReportView from "./ReportView";

export const metadata = { title: "Report · Mirai" };

export const instant = false;

export default function ParentReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportView />
    </Suspense>
  );
}
