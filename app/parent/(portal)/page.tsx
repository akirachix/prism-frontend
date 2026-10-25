"use client";

import Link from "next/link";

import { useUser } from "@/_components/SessionProvider";
import { Loading, PageHeader } from "@/_components/ui/bits";
import LatestUpdates from "@/_components/updates/LatestUpdates";
import { useLoad } from "@/_components/useLoad";
import { planForCase } from "@/lib/evaluation-flow";
import { parentEvaluationUpdates } from "@/lib/evaluation-updates";
import { studentName } from "@/lib/lookups";
import { useChild } from "../_components/ChildProvider";
import "@/_components/portal.css";

/**
 * Where a parent lands after signing in.
 * The parent Home feature (students and screening) replaces this page.
 */
export default function ParentHomePage() {
  const user = useUser();
  const { child, caseItem, loading } = useChild();
  const caseId = caseItem?.case_id ?? null;
  const updates = useLoad(async () => {
    if (!child || !caseId) return [];
    return parentEvaluationUpdates(child, await planForCase(caseId));
  }, [child?.student_id ?? null, caseId]);

  return (
    <main className="ui-page">
      <PageHeader title="Home" />
      <div className="ui-body">
        <h2 className="ui-section-title">
          Hello, {user.first_name || "parent"} 👋
        </h2>
        {loading ? (
          <Loading />
        ) : (
          <p className="ui-text">
            {child
              ? `Your child: ${studentName(child)}`
              : "Your account is not linked to a child yet."}
          </p>
        )}

        <section className="portal-section" aria-labelledby="updates-title">
          <h2 id="updates-title" className="ui-section-title">
            Latest updates
          </h2>
          <LatestUpdates
            items={updates.data ?? []}
            loading={loading || updates.loading}
            error={updates.error}
          />
        </section>

        <ul className="portal-menu">
          <li>
            <Link href="/parent/evaluation">Evaluation</Link>
          </li>
          <li>
            <Link href="/parent/school">School</Link>
          </li>
          <li>
            <Link href="/parent/account">Profile</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
