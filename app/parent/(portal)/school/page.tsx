"use client";

import { Mail, Phone, UserRound } from "lucide-react";

import Button from "@/_components/ui/Button";
import { Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { evaluationsApi, scaleLabel } from "@/lib/evaluation";
import { planForCase } from "@/lib/evaluation-flow";
import { fullName, usersApi } from "@/lib/users";
import { useChild } from "../../_components/ChildProvider";
import "@/_components/portal.css";
import "./school.css";

/** The teacher's 6-week evaluation of the child, and how to reach the teacher. */
async function loadSchool(caseId: string, teacherId: string) {
  const [plan, teacher] = await Promise.all([
    planForCase(caseId),
    // Parents may not be allowed to read staff accounts; then the card hides.
    usersApi.get(teacherId).catch(() => null),
  ]);
  if (!plan || plan.status !== "ACTIVE") return { teacher, answers: null };
  const questions = await evaluationsApi.questions(plan.iep_id);
  const answers = await Promise.all(
    [...questions]
      .sort((a, b) => a.position - b.position)
      .map(async (question) => {
        const responses = await evaluationsApi.responses({
          eval_question_id: question.eval_question_id,
          responder_role: "TEACHER",
        });
        return { question, response: responses[0] ?? null };
      }),
  );
  return { teacher, answers: answers.some((a) => a.response) ? answers : null };
}

export default function ParentSchoolPage() {
  const { caseItem, loading: childLoading } = useChild();
  const caseId = caseItem?.case_id ?? null;
  const teacherId = caseItem?.initiated_by ?? null;
  const { data, loading } = useLoad(
    () =>
      caseId && teacherId
        ? loadSchool(caseId, teacherId)
        : Promise.resolve(null),
    [caseId, teacherId],
  );

  return (
    <main className="ui-page">
      <PageHeader title="Teacher evaluation" />
      <div className="ui-body ui-body--narrow">
        {childLoading || loading ? (
          <Loading />
        ) : !caseItem ? (
          <Empty>Your child&apos;s teacher has not started anything yet.</Empty>
        ) : (
          <>
            <section
              className="ui-card school__card"
              aria-labelledby="eval-title"
            >
              <h2 id="eval-title" className="school__title">
                <span className="school__icon">
                  <UserRound size={22} aria-hidden="true" />
                </span>
                Evaluation by teacher
              </h2>
              {data?.answers ? (
                <>
                  <p className="school__muted">
                    How things have changed since the plan started, in the
                    teacher&apos;s words.
                  </p>
                  <dl className="school__answers">
                    {data.answers.map(({ question, response }) => (
                      <div
                        key={question.eval_question_id}
                        className="school__answer"
                      >
                        <dt>{question.question_text}</dt>
                        <dd>
                          {response
                            ? scaleLabel(response.score)
                            : "Not answered"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="ui-actions ui-actions--end no-print">
                    <Button onClick={() => window.print()}>Download PDF</Button>
                  </div>
                </>
              ) : (
                <p className="school__muted">
                  The teacher&apos;s evaluation appears here after the 6-week
                  check.
                </p>
              )}
            </section>

            {data?.teacher && (
              <section
                className="ui-card school__teacher"
                aria-labelledby="teacher-title"
              >
                <h2 id="teacher-title" className="school__title">
                  <UserRound size={22} aria-hidden="true" /> Teacher information
                </h2>
                <p className="school__muted">{fullName(data.teacher)}</p>
                <ul className="school__contacts">
                  {data.teacher.phone && (
                    <li>
                      <Phone size={18} aria-hidden="true" />
                      <a href={`tel:${data.teacher.phone.replace(/\s/g, "")}`}>
                        {data.teacher.phone}
                      </a>
                    </li>
                  )}
                  <li>
                    <Mail size={18} aria-hidden="true" />
                    <a href={`mailto:${data.teacher.email}`}>
                      {data.teacher.email}
                    </a>
                  </li>
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
