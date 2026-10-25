import { Suspense } from "react";

import WelcomeStep from "./WelcomeStep";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "Welcome · Mirai for parents" };

export default function WelcomePage() {
  return (
    <ParentAuth signup>
      <Suspense fallback={null}>
        <WelcomeStep />
      </Suspense>
    </ParentAuth>
  );
}
