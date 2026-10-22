"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import PlanContent from "@/app/_components/plan/PlanContent";
import "@/app/_components/plan/plan.css";
import { useUser } from "@/app/_components/SessionProvider";
import Button, { ButtonLink } from "@/app/_components/ui/Button";
import {
  Alert,
  Empty,
  Loading,
  PageHeader,
  Pill,
} from "@/app/_components/ui/bits";
import { TextAreaField } from "@/app/_components/ui/Field";
import { useLoad } from "@/app/_components/useLoad";
import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import { currentIep, evaluationIsOpen, iepsApi, type IEP } from "@/lib/ieps";
import { studentName, studentsApi } from "@/lib/lookups";
import "@/app/_components/portal.css";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, ieps] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    iepsApi.list({ case_id: caseId }),
  ]);
  return { caseItem, student, iep: currentIep(ieps) };
}

function statusPill(iep: IEP) {
  if (iep.status === "ACTIVE") return <Pill tone="sky">Approved</Pill>;
  if (iep.status === "REJECTED") return <Pill tone="blush">Sent back</Pill>;
  if (!iep.teacher_approved)
    return <Pill tone="blush">Waiting for your approval</Pill>;
  return <Pill tone="outline">Waiting for the admin</Pill>;
}

export default function TeacherPlanPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const { data, error, loading, setData } = useLoad(
    () => load(caseId),
    [caseId],
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ reason: string }>({ defaultValues: { reason: "" } });

  const header = (subtitle?: string) => (
    <PageHeader
      title="Education Plan (IEP)"
      back={{
        href: data
          ? `/teacher/students/${data.student.student_id}`
          : "/teacher/students",
      }}
    >
      {subtitle && <p className="plan-page__sub">{subtitle}</p>}
    </PageHeader>
  );

  if (loading)
    return (
      <main className="ui-page">
        {header()}
        <Loading />
      </main>
    );
  if (error || !data) {
    return (
      <main className="ui-page">
        {header()}
        <div className="ui-body">
          <Alert>{error ?? "We could not load the plan."}</Alert>
        </div>
      </main>
    );
  }

  const { caseItem, student, iep } = data;
  const subtitle = `${studentName(student)}  Adm. ${student.admission_number}`;

  async function approve(current: IEP) {
    setBusy(true);
    setActionError(null);
    try {
      let item = current;
      if (item.status === "DRAFT") item = await iepsApi.submit(item.iep_id);
      item = await iepsApi.approve(item.iep_id, "TEACHER", user.user_id);
      logAudit("APPROVE", "iep", item.iep_id, { role: "TEACHER" });
      setData({ caseItem, student, iep: item });
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendBack(current: IEP, reason: string) {
    setActionError(null);
    try {
      const item = await iepsApi.reject(current.iep_id, reason.trim());
      logAudit("REJECT", "iep", item.iep_id, { role: "TEACHER" });
      setData({ caseItem, student, iep: item });
      setRejecting(false);
      reset();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  if (!iep) {
    return (
      <main className="ui-page">
        {header(subtitle)}
        <div className="ui-body ui-body--narrow">
          <Empty>
            The plan is not ready yet. It is prepared once both screenings show
            something worth supporting. You will get a notification when it is
            ready.
          </Empty>
        </div>
      </main>
    );
  }

  const waitingForMe =
    iep.status === "PENDING_APPROVAL" || iep.status === "DRAFT";
  const canApprove = waitingForMe && !iep.teacher_approved;

  return (
    <main className="ui-page">
      {header(subtitle)}
      <div className="ui-body">
        <div className="ui-row-between">
          <span className="plan-page__version">
            Version {iep.version_number}
          </span>
          {statusPill(iep)}
        </div>

        <Alert tone="warning">
          This is a draft made by AI. Read it with care. It is not a diagnosis.
        </Alert>

        <div className="plan-page__grid">
          <section className="ui-card">
            <PlanContent iep={iep} />
          </section>

          <aside className="plan-page__side">
            <div className="plan-approval">
              <h2 className="ui-section-title">Approval status</h2>
              <div className="plan-approval__row">
                <span>You (Teacher)</span>
                <Pill tone={iep.teacher_approved ? "sky" : "blush"}>
                  {iep.teacher_approved ? "Approved" : "Waiting"}
                </Pill>
              </div>
              <div className="plan-approval__row">
                <span>School administrator</span>
                <Pill tone={iep.admin_approved ? "sky" : "blush"}>
                  {iep.admin_approved ? "Approved" : "Waiting"}
                </Pill>
              </div>
              <p className="plan-approval__note">
                {iep.status === "ACTIVE"
                  ? `The plan started on ${formatDay(iep.approved_at)}. The 6-week check opens on ${formatDay(iep.evaluation_unlock_date)}.`
                  : "The plan starts when you both approve. Then the 6-week check opens six weeks later."}
              </p>
              {iep.status === "REJECTED" && iep.rejection_reason && (
                <p className="plan-approval__note">
                  <strong>Sent back because:</strong> {iep.rejection_reason}
                </p>
              )}
            </div>

            {actionError && <Alert>{actionError}</Alert>}

            {rejecting ? (
              <form
                className="plan-reject ui-card"
                onSubmit={handleSubmit(({ reason }) => sendBack(iep, reason))}
                noValidate
              >
                <TextAreaField
                  label="What should change?"
                  rows={4}
                  placeholder="For example: the goals are too hard for this term."
                  error={errors.reason?.message}
                  {...register("reason", {
                    required: "Tell us what should change.",
                    minLength: {
                      value: 3,
                      message: "Write at least 3 characters.",
                    },
                    maxLength: {
                      value: 1000,
                      message: "Use 1000 characters or fewer.",
                    },
                  })}
                />
                <div className="ui-actions ui-actions--end">
                  <Button variant="outline" onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Send back
                  </Button>
                </div>
              </form>
            ) : (
              <div className="plan-page__actions">
                {canApprove && (
                  <Button onClick={() => approve(iep)} loading={busy}>
                    {busy ? "Approving…" : "Approve this plan"}
                  </Button>
                )}
                {waitingForMe && (
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(true)}
                    disabled={busy}
                  >
                    Regenerate the plan
                  </Button>
                )}
                {iep.status === "ACTIVE" && (
                  <ButtonLink
                    href={`/teacher/cases/${caseId}/check`}
                    variant={evaluationIsOpen(iep) ? "primary" : "outline"}
                  >
                    {evaluationIsOpen(iep)
                      ? "Start the 6-week check"
                      : "View the 6-week check"}
                  </ButtonLink>
                )}
                <Link
                  href={`/teacher/cases/${caseId}/report`}
                  className="plan-page__report"
                >
                  See the screening report
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
