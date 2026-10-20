"use client";

import { useMemo, useState } from "react";

import { formatDate, labelOf } from "@/lib/format";
import { studentName, type Student } from "@/lib/lookups";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import "./cases-table.module.css";

interface Props {
  cases: Case[];
  studentsById: Map<string, Student>;
  onSelect: (item: Case) => void;
}

const AVATAR_COLOURS = ["#ff8c42", "#0a2a66", "#d62839", "#2f77b5", "#b8d4e8"];

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "ST";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CasesTable({ cases, studentsById, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const statuses = useMemo(
    () => Array.from(new Set(cases.map((item) => item.status))),
    [cases],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cases.filter((item) => {
      if (status && item.status !== status) return false;
      if (!term) return true;
      const student = studentsById.get(item.student_id);
      const text = [
        student ? studentName(student) : "",
        student?.admission_number ?? "",
        item.student_id,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [cases, studentsById, search, status]);

  return (
    <section className="cases-table">
      <div className="cases-table__filters">
        <input
          className="cases-table__search"
          type="search"
          placeholder="Search students"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search students"
        />
        <select
          className="cases-table__select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {labelOf(item)}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="cases-table__empty">No cases match your search.</p>
      ) : (
        <div className="cases-table__card">
          <table className="cases-table__table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Started</th>
                <th>Where the case is</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const student = studentsById.get(item.student_id);
                const name = student
                  ? studentName(student)
                  : `Student ${item.student_id.slice(0, 8)}`;
                const finished = FINISHED_STATUSES.includes(item.status);
                return (
                  <tr key={item.case_id}>
                    <td>
                      <div className="cases-table__student">
                        <span
                          className="cases-table__avatar"
                          style={{
                            background:
                              AVATAR_COLOURS[index % AVATAR_COLOURS.length],
                          }}
                        >
                          {student ? initials(name) : "ST"}
                        </span>
                        <span>{name}</span>
                      </div>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <span
                        className={
                          finished
                            ? "cases-table__pill cases-table__pill--done"
                            : "cases-table__pill"
                        }
                      >
                        {labelOf(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cases-table__open"
                        onClick={() => onSelect(item)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
