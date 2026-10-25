"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import AddStudentModal from "@/app/teacher/_components/students/AddStudentModal";
import { useUser } from "@/_components/SessionProvider";
import Button, { ButtonLink } from "@/_components/ui/Button";
import {
  Alert,
  Avatar,
  Empty,
  Loading,
  PageHeader,
  Pill,
} from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { loadClassroom, studentStatus } from "@/lib/classroom";
import {
  checkStates,
  unavailableCount,
  withCheckState,
} from "@/lib/evaluation-flow";
import { canDownload, planState, type IEP } from "@/lib/ieps";
import { ageInYears, studentName } from "@/lib/lookups";
import { fullName } from "@/lib/users";
import "@/_components/portal.css";
import "./students.css";

type Filter = "all" | "action" | "plan" | "active";
const PAGE_SIZE = 12;

function PlanActions({ caseId, iep }: { caseId: string; iep: IEP }) {
  const base = `/teacher/cases/${caseId}/plan`;
  const waiting = planState(iep).waitingForMe && iep.status !== "ACTIVE";
  return (
    <div className="students-plan">
      <ButtonLink href={base} small variant={waiting ? "primary" : "outline"}>
        {waiting ? "Review plan" : "View plan"}
      </ButtonLink>
      {canDownload(iep) && (
        <ButtonLink
          href={`${base}/print`}
          small
          variant="link"
          aria-label="Download the plan as PDF"
        >
          PDF
        </ButtonLink>
      )}
    </div>
  );
}

export default function StudentsView() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const asked = params.get("filter");
  const filter: Filter =
    asked === "action" || asked === "plan" || asked === "active"
      ? asked
      : "all";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const room = useLoad(() => loadClassroom(user.user_id), [user.user_id]);
  const activePlans = room.data
    ? Array.from(room.data.iepByCase.values())
        .filter((iep) => iep.status === "ACTIVE")
        .map((iep) => iep.iep_id)
    : [];
  const checks = useLoad(() => checkStates(activePlans), [activePlans]);

  const rows = useMemo(() => {
    if (!room.data) return [];
    const data = room.data;
    return data.students
      .map((student) => {
        const caseItem = data.caseByStudent.get(student.student_id);
        const iep = caseItem ? data.iepByCase.get(caseItem.case_id) : undefined;
        const base = studentStatus(caseItem, iep);
        const state = iep ? checks.data?.get(iep.iep_id) : undefined;
        return { student, caseItem, iep, status: withCheckState(base, state) };
      })
      .sort((a, b) =>
        studentName(a.student).localeCompare(studentName(b.student)),
      );
  }, [room.data, checks.data]);

  const missingChecks = unavailableCount(checks.data);

  const counts = {
    all: rows.length,
    action: rows.filter((row) => row.status.needsAction).length,
    plan: rows.filter((row) => row.iep).length,
    active: rows.filter((row) => row.status.activePlan).length,
  };

  const visible = rows.filter((row) => {
    if (filter === "action" && !row.status.needsAction) return false;
    if (filter === "plan" && !row.iep) return false;
    if (filter === "active" && !row.status.activePlan) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${studentName(row.student)} ${row.student.admission_number}`
      .toLowerCase()
      .includes(term);
  });
  const shown = visible.slice(0, page * PAGE_SIZE);

  function setFilter(next: Filter) {
    setPage(1);
    router.replace(
      next === "all" ? "/teacher/students" : `/teacher/students?filter=${next}`,
    );
  }

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "action", label: `Needs my action (${counts.action})` },
    { key: "plan", label: `Plans (IEP) (${counts.plan})` },
    { key: "active", label: `Active IEP (${counts.active})` },
  ];

  return (
    <main className="ui-page">
      <PageHeader
        title="Students"
        avatar={
          <Avatar
            name={fullName(user)}
            id={user.user_id}
            colour="#d62839"
            size={44}
          />
        }
      />
      <div className="ui-body">
        <div className="ui-row-between students-top">
          <h2 className="ui-section-title">Your class</h2>
          <div className="portal-search students-search">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search name or admission no."
              aria-label="Search by name or admission number"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="orange"
            small
            className="students-add"
            onClick={() => setAdding(true)}
          >
            + Add student
          </Button>
        </div>

        <div className="portal-chips" role="group" aria-label="Filter students">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="portal-chip"
              aria-pressed={filter === chip.key}
              onClick={() => setFilter(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {room.error && <Alert>{room.error}</Alert>}
        {missingChecks > 0 && (
          <Alert tone="warning">
            We could not load the 6-week check status for {missingChecks}{" "}
            {missingChecks === 1 ? "student" : "students"}. Their status shows
            as unavailable.{" "}
            <Button
              variant="link"
              onClick={() => checks.reload()}
              loading={checks.loading}
            >
              Try again
            </Button>
          </Alert>
        )}
        {room.loading && <Loading label="Loading your class…" />}
        {!room.loading && !room.error && visible.length === 0 && (
          <Empty>
            {rows.length === 0
              ? "No students yet. Add your first student to start."
              : "No students match."}
          </Empty>
        )}

        {shown.length > 0 && (
          <>
            <ul className="portal-list portal-cards-only">
              {shown.map(({ student, caseItem, iep, status }) => (
                <li key={student.student_id}>
                  <Link
                    href={`/teacher/students/${student.student_id}`}
                    className="portal-person"
                  >
                    <Avatar
                      name={studentName(student)}
                      id={student.student_id}
                    />
                    <span className="students-person">
                      <span className="portal-person__name">
                        {studentName(student)}
                      </span>
                      <span className="portal-person__sub">
                        {student.admission_number}
                      </span>
                    </span>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </Link>
                  {caseItem && iep && (
                    <div className="students-card-plan">
                      <PlanActions caseId={caseItem.case_id} iep={iep} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="portal-table-card portal-table-only">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Names</th>
                    <th>Admission number</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Plan (IEP)</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ student, caseItem, iep, status }) => (
                    <tr key={student.student_id}>
                      <td>
                        <Link href={`/teacher/students/${student.student_id}`}>
                          {studentName(student)}
                        </Link>
                      </td>
                      <td>{student.admission_number}</td>
                      <td>{ageInYears(student.date_of_birth) ?? "—"}</td>
                      <td>
                        <Pill tone={status.tone}>{status.label}</Pill>
                      </td>
                      <td>
                        {caseItem && iep ? (
                          <PlanActions caseId={caseItem.case_id} iep={iep} />
                        ) : (
                          <span className="students-noplan">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ui-row-between students-foot">
              <span>
                You only see children linked to you. Showing {shown.length} of{" "}
                {visible.length}
              </span>
              {shown.length < visible.length && (
                <button
                  type="button"
                  className="ui-btn ui-btn--link"
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {adding && (
        <AddStudentModal
          onClose={() => setAdding(false)}
          onCreated={() => room.reload()}
        />
      )}
    </main>
  );
}
