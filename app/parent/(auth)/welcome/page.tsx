import { Suspense } from "react";

import WelcomeStep from "./WelcomeStep";

export const metadata = { title: "Welcome · Mirai for parents" };

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeStep />
    </Suspense>
  );
}
