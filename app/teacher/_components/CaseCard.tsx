"use client";

import { labelOf } from "@/lib/format";
import type { Student } from "@/lib/lookups";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import "./case-card.css";

export default function CaseCard({
  item,
  student,
  onSelect,
}: {
  item: Case;
  student?: Student;
  onSelect: (item: Case) => void;
}) {
  const finished = FINISHED_STATUSES.includes(item.status);
  const name = student
    ? `${student.first_name} ${student.last_name}`
    : `Student ${item.student_id.slice(0, 8)}`;
  const initials = student
    ? `${student.first_name[0]}${student.last_name[0]}`
    : item.student_id.slice(0, 2);
  const detail = student
    ? `${student.admission_number} · Case ${item.case_id.slice(0, 8)}`
    : `Case ${item.case_id.slice(0, 8)}`;

  return (
    <button type="button" className="case-card" onClick={() => onSelect(item)}>
      <span className="case-card__avatar" aria-hidden="true">
        {initials.toUpperCase()}
      </span>
      <span className="case-card__info">
        <span className="case-card__name">{name}</span>
        <span className="case-card__id">{detail}</span>
      </span>
      <span
        className={
          finished
            ? "case-card__pill case-card__pill--finished"
            : "case-card__pill"
        }
      >
        {labelOf(item.status)}
      </span>
    </button>
  );
}
