import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CasesTable from "@/app/teacher/_components/CasesTable";
import { makeCase } from "@/tests/helpers";

const CASES = [
  makeCase({ case_id: "c1" }),
  makeCase({
    case_id: "c2",
    student_id: "bbbbbbbb-0000-0000-0000-000000000000",
    status: "CLOSED",
  }),
];

describe("CasesTable", () => {
  it("shows one row for each case", () => {
    render(
      <CasesTable
        cases={CASES}
        studentsById={new Map()}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("filters by the search box", async () => {
    render(
      <CasesTable
        cases={CASES}
        studentsById={new Map()}
        onSelect={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText("Search students"), "bbbbbbbb");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("filters by status", async () => {
    render(
      <CasesTable
        cases={CASES}
        studentsById={new Map()}
        onSelect={jest.fn()}
      />,
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Filter by status"),
      "CLOSED",
    );
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("opens a case when Open is clicked", async () => {
    const onSelect = jest.fn();
    render(
      <CasesTable cases={CASES} studentsById={new Map()} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getAllByText("Open")[0]);
    expect(onSelect).toHaveBeenCalledWith(CASES[0]);
  });

  it("tells the user when nothing matches", async () => {
    render(
      <CasesTable
        cases={CASES}
        studentsById={new Map()}
        onSelect={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByLabelText("Search students"), "zzzz");
    expect(screen.getByText("No cases match your search.")).toBeInTheDocument();
  });
});
