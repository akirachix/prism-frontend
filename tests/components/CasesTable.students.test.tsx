import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CasesTable from "@/app/teacher/_components/cases/CasesTable";
import { makeCase, makeStudent } from "@/tests/helpers";

const known = makeStudent();
const CASES = [
  makeCase({ case_id: "c1" }),
  makeCase({
    case_id: "c2",
    student_id: "bbbbbbbb-0000-0000-0000-000000000000",
    status: "CLOSED",
  }),
];
const STUDENTS = new Map([[known.student_id, known]]);

describe("CasesTable with student names", () => {
  it("shows the real name and initials when the student is known", () => {
    render(
      <CasesTable cases={CASES} studentsById={STUDENTS} onSelect={jest.fn()} />,
    );
    expect(screen.getByText("Amani Otieno")).toBeInTheDocument();
    expect(screen.getByText("AO")).toBeInTheDocument();
  });

  it("finds a case by the student's name", async () => {
    const user = userEvent.setup();
    render(
      <CasesTable cases={CASES} studentsById={STUDENTS} onSelect={jest.fn()} />,
    );
    await user.type(screen.getByLabelText("Search students"), "otieno");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Amani Otieno")).toBeInTheDocument();
  });

  it("finds a case by admission number", async () => {
    const user = userEvent.setup();
    render(
      <CasesTable cases={CASES} studentsById={STUDENTS} onSelect={jest.fn()} />,
    );
    await user.type(screen.getByLabelText("Search students"), "ADM-001");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("styles a finished case differently from an open one", () => {
    render(
      <CasesTable cases={CASES} studentsById={STUDENTS} onSelect={jest.fn()} />,
    );
    const closed = screen
      .getAllByText("Closed")
      .find((el) => el.tagName === "SPAN");
    const open = screen
      .getAllByText("Initiated")
      .find((el) => el.tagName === "SPAN");
    expect(closed).toHaveClass("cases-table__pill--done");
    expect(open).not.toHaveClass("cases-table__pill--done");
  });

  it("only offers statuses that exist in the data", () => {
    render(
      <CasesTable cases={CASES} studentsById={STUDENTS} onSelect={jest.fn()} />,
    );
    const select = screen.getByLabelText("Filter by status");
    expect(within(select).getAllByRole("option")).toHaveLength(3);
  });
});
