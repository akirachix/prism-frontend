import { Suspense } from "react";

import ReportsOverview from "./ReportsOverview";

export const metadata = { title: "Reports · Mirai" };

export default function ParentReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsOverview />
    </Suspense>
  );
}
