"use client";

import { Mail, Phone, UserRound } from "lucide-react";

import EvaluationReports from "@/_components/evaluation/EvaluationReports";
import { Alert, Empty, Loading, PageHeader } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { fetchAll } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { loadEvaluationReports } from "@/lib/evaluation-reports";
import { formatDate } from "@/lib/format";
import { studentName } from "@/lib/lookups";
import { fullName, usersApi, type UserRead } from "@/lib/users";
import { useChild } from "../../_components/ChildProvider";
import "@/_components/portal.css";
import "./school.css";

async function loadSchool(studentId: string, teacherId: string) {
  const [teacher, cases] = await Promise.all([
    // A parent may only read their own child's teacher; null otherwise.
    usersApi.get(teacherId).catch((): UserRead | null => null),
    fetchAll((limit, offset) =>
      casesApi.listBy({ student_id: studentId, limit, offset }),
    ),
  ]);
  const reports = await loadEvaluationReports(
    cases.map((item) => item.case_id),
  );
  return {
    teacher,
    reports: reports.filter((report) => report.role === "TEACHER"),
  };
}

/** The teacher's 6-week evaluations of the child, and how to reach them. */
export default function ParentSchoolPage() {
  const { child, loading: childLoading } = useChild();
  const studentId = child?.student_id ?? null;
  const teacherId = child?.teacher_id ?? null;
  const { data, error, loading } = useLoad(
    () =>
      studentId && teacherId
        ? loadSchool(studentId, teacherId)
        : Promise.resolve(null),
    [studentId, teacherId],
  );

  const teacherName = data?.teacher ? fullName(data.teacher) : "Teacher";
  const latest = data?.reports[0];

  return (
    <main className="ui-page">
      <PageHeader title="School" />
      <div className="ui-body school">
        {childLoading || (loading && !data) ? (
          <Loading />
        ) : !child ? (
          <Empty>Your account is not linked to a child yet.</Empty>
        ) : error ? (
          <Alert>{error}</Alert>
        ) : (
          <div className="school__grid">
            <section
              className="ui-card school__card"
              aria-labelledby="eval-title"
            >
              <div className="school__head">
                <span className="school__icon">
                  <UserRound size={26} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="eval-title" className="school__title">
                    Evaluation by teacher
                  </h2>
                  <p className="school__subtitle">
                    {teacherName} · {studentName(child)}
                  </p>
                  <p className="school__muted">
                    {latest
                      ? `Last sent ${formatDate(latest.submittedAt)}`
                      : "Nothing sent yet"}
                  </p>
                </div>
              </div>
              <EvaluationReports
                reports={data?.reports ?? []}
                childName={studentName(child)}
                nameFor={() => teacherName}
                empty="The teacher's evaluation appears here after their 6-week check."
              />
            </section>

            <section
              className="ui-card school__teacher"
              aria-labelledby="teacher-title"
            >
              <div className="school__head">
                <span className="school__icon school__icon--plain">
                  <UserRound size={26} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="teacher-title" className="school__title">
                    Teacher information
                  </h2>
                  <p className="school__subtitle">{teacherName}</p>
                  <p className="school__muted">
                    Your child&apos;s learning support
                  </p>
                </div>
              </div>
              <ul className="school__contacts">
                <li>
                  <Phone size={18} aria-hidden="true" />
                  {data?.teacher?.phone ? (
                    <a href={`tel:${data.teacher.phone.replace(/\s/g, "")}`}>
                      {data.teacher.phone}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </li>
                <li>
                  <Mail size={18} aria-hidden="true" />
                  {data?.teacher?.email ? (
                    <a href={`mailto:${data.teacher.email}`}>
                      {data.teacher.email}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
