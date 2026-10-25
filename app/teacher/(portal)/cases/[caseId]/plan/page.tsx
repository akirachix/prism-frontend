"use client";

import { Check, Download, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import PlanContent from "@/_components/plan/PlanContent";
import "@/_components/plan/plan.css";
import { useUser } from "@/_components/SessionProvider";
import Button, { ButtonLink } from "@/_components/ui/Button";
import { Alert, Empty, Loading, PageHeader, Pill } from "@/_components/ui/bits";
import { TextAreaField } from "@/_components/ui/Field";
import { useLoad } from "@/_components/useLoad";
import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { casesApi } from "@/lib/cases";
import { formatDay } from "@/lib/format";
import {
  approvalSteps,
  canDownload,
  currentIep,
  evaluationIsOpen,
  iepsApi,
  plansForCase,
  planState,
  regeneratePlan,
  type IEP,
} from "@/lib/ieps";
import { studentName, studentsApi } from "@/lib/lookups";
import "@/_components/portal.css";

async function load(caseId: string) {
  const caseItem = await casesApi.get(caseId);
  const [student, ieps] = await Promise.all([
    studentsApi.get(caseItem.student_id),
    plansForCase(caseId),
  ]);
  return { caseItem, student, iep: currentIep(ieps) };
}

function ApprovalSteps({ iep }: { iep: IEP }) {
  return (
    <ol className="plan-steps" aria-label="Approval steps">
      {approvalSteps(iep).map((step) => (
        <li
          key={step.label}
          className={`plan-steps__item${step.done ? " plan-steps__item--done" : ""}${step.current ? " plan-steps__item--current" : ""}`}
          aria-current={step.current ? "step" : undefined}
        >
          <span className="plan-steps__dot" aria-hidden="true">
            {step.done && <Check size={14} />}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export default function TeacherPlanPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const user = useUser();
  const { data, error, loading, setData } = useLoad(
    () => load(caseId),
    [caseId],
  );
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ prompt: string }>({ defaultValues: { prompt: "" } });

  const studentHref = data
    ? `/teacher/students/${data.student.student_id}`
    : "/teacher/students";
  const header = (subtitle?: string) => (
    <PageHeader
      title="Education Plan (IEP)"
      eyebrow="Student"
      back={{ href: studentHref, label: "Back to the student" }}
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
  const subtitle = `${studentName(student)} · Adm. ${student.admission_number}`;

  if (!iep) {
    return (
      <main className="ui-page">
        {header(subtitle)}
        <div className="ui-body ui-body--narrow">
          <Empty>
            {caseItem.status === "NO_CONCERN_IDENTIFIED"
              ? "No plan is needed: the screening raised no concern."
              : "The plan is not ready yet. It is prepared once both screenings show something worth supporting. You will get a notification when it is ready."}
          </Empty>
        </div>
      </main>
    );
  }

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

  async function askForChanges(current: IEP, prompt: string) {
    setGenerating(true);
    setActionError(null);
    try {
      if (current.status !== "REJECTED") {
        logAudit("REJECT", "iep", current.iep_id, {
          role: "TEACHER",
          regenerate: true,
        });
      }
      const next = await regeneratePlan(current, prompt);
      setData({ caseItem, student, iep: next });
      setAsking(false);
      reset();
    } catch (err) {
      setActionError(errorMessage(err));
      try {
        const ieps = await plansForCase(caseId);
        setData({ caseItem, student, iep: currentIep(ieps) });
      } catch {}
    } finally {
      setGenerating(false);
    }
  }

  const state = planState(iep);
  const waitingForMe =
    (iep.status === "PENDING_APPROVAL" || iep.status === "DRAFT") &&
    !iep.teacher_approved;
  const canAskForChanges =
    iep.status === "PENDING_APPROVAL" || iep.status === "DRAFT";
  const sentBack = iep.status === "REJECTED";

  return (
    <main className="ui-page">
      {header(subtitle)}
      <div className="ui-body">
        <div className="ui-row-between">
          <span className="plan-page__version">
            Version {iep.version_number}
          </span>
          <Pill tone={state.tone}>{state.label}</Pill>
        </div>

        <ApprovalSteps iep={iep} />

        {iep.status !== "ACTIVE" && (
          <Alert tone="warning">
            This is a draft made by AI. Read it with care. It is not a
            diagnosis.
          </Alert>
        )}

        <div className="plan-page__grid">
          <section className="ui-card">
            <PlanContent iep={iep} />
          </section>

          <aside className="plan-page__side">
            <div className="plan-approval">
              <h2 className="ui-section-title">Approval</h2>
              <div className="plan-approval__row">
                <span>You (teacher)</span>
                <Pill tone={iep.teacher_approved ? "sky" : "blush"}>
                  {iep.teacher_approved ? "Approved" : "Waiting"}
                </Pill>
              </div>
              <div className="plan-approval__row">
                <span>School admin</span>
                <Pill tone={iep.admin_approved ? "sky" : "blush"}>
                  {iep.admin_approved ? "Approved" : "Waiting"}
                </Pill>
              </div>
              <p className="plan-approval__note">
                {iep.status === "ACTIVE"
                  ? `Active since ${formatDay(iep.approved_at)}. The 6-week check opens on ${formatDay(iep.evaluation_unlock_date)}.`
                  : iep.teacher_approved
                    ? "You approved it. It becomes active, and can be downloaded, once the school admin approves it too."
                    : "Approve it if it fits the child. If something should change, ask the AI for a new version."}
              </p>
            </div>

            {actionError && <Alert>{actionError}</Alert>}

            {generating ? (
              <div className="ui-card plan-generating" aria-live="polite">
                <Sparkles size={22} aria-hidden="true" />
                <div>
                  <strong>Writing the new plan…</strong>
                  <p className="plan-approval__note">
                    This can take a minute. Stay on this page; the new version
                    appears here for you to approve.
                  </p>
                </div>
              </div>
            ) : sentBack ? (
              <div className="ui-card plan-reject">
                <strong>You asked for a new version</strong>
                {iep.rejection_reason && (
                  <p className="plan-approval__note">
                    Your request: “{iep.rejection_reason}”
                  </p>
                )}
                <p className="plan-approval__note">
                  If the new plan has not appeared, ask the AI to write it now.
                </p>
                <Button
                  onClick={() => askForChanges(iep, iep.rejection_reason ?? "")}
                >
                  Write the new plan
                </Button>
              </div>
            ) : asking ? (
              <form
                className="plan-reject ui-card"
                onSubmit={handleSubmit(({ prompt }) =>
                  askForChanges(iep, prompt),
                )}
                noValidate
              >
                <TextAreaField
                  label="What should the AI change?"
                  rows={5}
                  placeholder="For example: make the reading goals smaller steps, and add one strategy for group work."
                  error={errors.prompt?.message}
                  {...register("prompt", {
                    required: "Tell the AI what to change.",
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
                <p className="plan-approval__note">
                  This version is set aside and the AI writes version{" "}
                  {iep.version_number + 1}. You and the school admin then
                  approve the new one.
                </p>
                <div className="ui-actions ui-actions--end">
                  <Button variant="outline" onClick={() => setAsking(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Write a new version</Button>
                </div>
              </form>
            ) : (
              <div className="plan-page__actions">
                {waitingForMe && (
                  <Button onClick={() => approve(iep)} loading={busy}>
                    {busy ? "Approving…" : "Approve this plan"}
                  </Button>
                )}
                {canAskForChanges && (
                  <Button
                    variant="outline"
                    onClick={() => setAsking(true)}
                    disabled={busy}
                  >
                    <Sparkles size={18} aria-hidden="true" /> Ask the AI for
                    changes
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
                {canDownload(iep) && (
                  <ButtonLink
                    href={`/teacher/cases/${caseId}/plan/print`}
                    variant="outline"
                  >
                    <Download size={18} aria-hidden="true" /> Download PDF
                  </ButtonLink>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
