"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useUser } from "@/app/_components/SessionProvider";
import { ButtonLink } from "@/app/_components/ui/Button";
import { Alert, Avatar, Empty, Loading, PageHeader, Pill } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { loadClassroom, studentStatus } from "@/lib/classroom";
import { studentName } from "@/lib/lookups";
import { fullName } from "@/lib/users";
import "@/app/_components/portal.css";
import "./students.css";

type Filter = "all" | "action" | "active";
const PAGE_SIZE = 12;

export default function StudentsView() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const filter = (params.get("filter") as Filter | null) ?? "all";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const room = useLoad(() => loadClassroom(user.user_id), [user.user_id]);

  const rows = useMemo(() => {
    if (!room.data) return [];
    const data = room.data;
    return data.students
      .map((student) => {
        const caseItem = data.caseByStudent.get(student.student_id);
        const iep = caseItem ? data.iepByCase.get(caseItem.case_id) : undefined;
        return { student, status: studentStatus(caseItem, iep) };
      })
      .sort((a, b) => studentName(a.student).localeCompare(studentName(b.student)));
  }, [room.data]);

  const counts = {
    all: rows.length,
    action: rows.filter((row) => row.status.needsAction).length,
    active: rows.filter((row) => row.status.activePlan).length,
  };

  const visible = rows.filter((row) => {
    if (filter === "action" && !row.status.needsAction) return false;
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
    router.replace(next === "all" ? "/teacher/students" : `/teacher/students?filter=${next}`);
  }

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "action", label: `Needs my action (${counts.action})` },
    { key: "active", label: "Active IEP" },
  ];

  return (
    <main className="ui-page">
      <PageHeader
        title="Students"
        avatar={<Avatar name={fullName(user)} id={user.user_id} colour="#d62839" size={44} />}
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
          <ButtonLink href="/teacher/students/new" variant="orange" small className="students-add">
            + Add student
          </ButtonLink>
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
              {shown.map(({ student, status }) => (
                <li key={student.student_id}>
                  <Link href={`/teacher/students/${student.student_id}`} className="portal-person">
                    <Avatar name={studentName(student)} id={student.student_id} />
                    <span className="portal-person__name">{studentName(student)}</span>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="portal-table-card portal-table-only">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Names</th>
                    <th>Admission number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ student, status }) => (
                    <tr key={student.student_id}>
                      <td>
                        <Link href={`/teacher/students/${student.student_id}`}>
                          {studentName(student)}
                        </Link>
                      </td>
                      <td>{student.admission_number}</td>
                      <td>
                        <Pill tone={status.tone}>{status.label}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ui-row-between students-foot">
              <span>
                You only see children linked to you. Showing {shown.length} of {visible.length}
              </span>
              {shown.length < visible.length && (
                <button type="button" className="ui-btn ui-btn--link" onClick={() => setPage(page + 1)}>
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
