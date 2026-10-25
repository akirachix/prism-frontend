import { Suspense } from "react";

import StudentsView from "./StudentsView";

export const metadata = { title: "Students · Mirai" };

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsView />
    </Suspense>
  );
}
