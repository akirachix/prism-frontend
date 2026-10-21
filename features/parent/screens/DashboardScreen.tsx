"use client";

import Link from "next/link";
import { ChecklistIcon, DocIcon, UserIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/StateMessage";
import { useSession } from "@/features/auth";
import { useAsync } from "@/lib/use-async";
import { parentApi } from "../api";

export function DashboardScreen() {
  const { user } = useSession();
  const { data: child, error, reload } = useAsync(parentApi.child);
  const dash = (value?: string | null) => value || "—";

  return (
    <>
      <PageHeader title="Home" />
      <div className="page-body">
        <h2 className="greeting">Hello, {user?.firstName || "parent"} 👋</h2>
        <p className="subtle">Here’s your child’s latest information.</p>

        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : (
          <section className="card child-card" aria-label="Your child">
            <div className="child-card__top">
              <span className="avatar">
                <UserIcon size={22} />
              </span>
              <h3 className="child-card__name">
                {child?.name ?? "Your child"}
              </h3>
            </div>
            <dl className="stats">
              <div>
                <dt>Date of birth</dt>
                <dd>{dash(child?.dateOfBirth)}</dd>
              </div>
              <div>
                <dt>Class</dt>
                <dd>{dash(child?.className)}</dd>
              </div>
              <div>
                <dt>Admission ID</dt>
                <dd>{dash(child?.admissionId)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{dash(child?.status)}</dd>
              </div>
            </dl>
            <Button href="/parent/screening">Start screening</Button>
            <Button
              href="/parent/reports"
              variant="link"
              className="btn--center"
              style={{ display: "flex", marginTop: 18 }}
            >
              View reports
            </Button>
          </section>
        )}

        <div className="quick">
          <Link href="/parent/reports" className="quick__card">
            <DocIcon size={16} />
            <p className="quick__title">Reports</p>
            <p className="quick__text">View screening and evaluation reports</p>
          </Link>
          <Link href="/parent/evaluation" className="quick__card">
            <ChecklistIcon size={20} />
            <p className="quick__title">Evaluation</p>
            <p className="quick__text">Complete a parent evaluation</p>
          </Link>
        </div>
      </div>
    </>
  );
}
