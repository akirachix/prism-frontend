import { Suspense } from "react";

import ResetChooser from "./ResetChooser";
import "../home.css";

export const metadata = { title: "Reset your password · Mirai" };

export default function ResetPasswordChooserPage() {
  return (
    <main className="home">
      <div className="home__card">
        <h1 className="home__title">Reset your password</h1>
        <p className="home__text">
          Are you signing in as a teacher or a parent?
        </p>
        <Suspense fallback={null}>
          <ResetChooser />
        </Suspense>
      </div>
    </main>
  );
}
