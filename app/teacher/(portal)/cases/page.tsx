"use client";

import { useEffect, useMemo, useState } from "react";

import CaseDetailModal from "@/app/teacher/_components/cases/CaseDetailModal";
import CasesTable from "@/app/teacher/_components/cases/CasesTable";
import { errorMessage, fetchAll } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { getStudents, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";
import "./cases-page.css";

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Case | null>(null);

  useEffect(() => {
    fetchAll((limit, offset) => getStudents(undefined, limit, offset))
      .then(setStudents)
      .catch(() => setStudents([]));
    fetchAll((limit, offset) => casesApi.list(limit, offset))
      .then(setCases)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.student_id, student])),
    [students],
  );

  function handleCaseChange(updated: Case) {
    setCases((current) =>
      current.map((item) =>
        item.case_id === updated.case_id ? updated : item,
      ),
    );
    setSelected(updated);
  }

  function handleDeleted(caseId: string) {
    setCases((current) => current.filter((item) => item.case_id !== caseId));
    setSelected(null);
  }

  return (
    <main className="cases-page">
      <header className="cases-page__header">
        <div>
          <h1 className="cases-page__title">Cases</h1>
          {!loading && !error && (
            <p className="cases-page__count">
              {cases.length} {cases.length === 1 ? "case" : "cases"}
            </p>
          )}
        </div>
      </header>

      {(loading || error || cases.length === 0) && (
        <div className="cases-page__content">
          {loading && <p className="cases-page__message">Loading cases…</p>}
          {error && <p className="cases-page__error">{error}</p>}
          {!loading && !error && cases.length === 0 && (
            <p className="cases-page__message">No cases yet.</p>
          )}
        </div>
      )}

      {!loading && !error && cases.length > 0 && (
        <CasesTable
          cases={cases}
          studentsById={studentsById}
          onSelect={setSelected}
        />
      )}

      {selected && (
        <CaseDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onCaseChange={handleCaseChange}
          onDeleted={handleDeleted}
        />
      )}
    </main>
  );
}
