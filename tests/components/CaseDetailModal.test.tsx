import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CaseDetailModal from "@/app/teacher/_components/cases/CaseDetailModal";
import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { makeCase } from "@/tests/helpers";

jest.mock("@/lib/cases", () => ({
  casesApi: { remove: jest.fn(), update: jest.fn(), close: jest.fn() },
}));

const mockRemove = casesApi.remove as jest.Mock;

function setup(overrides = {}) {
  const props = {
    item: makeCase(overrides),
    onClose: jest.fn(),
    onCaseChange: jest.fn(),
    onDeleted: jest.fn(),
  };
  render(<CaseDetailModal {...props} />);
  return props;
}

beforeEach(() => mockRemove.mockReset());

describe("CaseDetailModal", () => {
  it("shows the case and dates sections", () => {
    setup();
    expect(screen.getByText("Case")).toBeInTheDocument();
    expect(screen.getByText("Dates")).toBeInTheDocument();
  });

  it("never shows screening scores or the main area to the teacher", () => {
    setup({ autism_score: 2.4, adhd_score: 1.1, primary_domain: "ADHD" });
    expect(screen.queryByText("Screening results")).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Primary domain")).not.toBeInTheDocument();
    expect(screen.queryByText("2.4")).not.toBeInTheDocument();
  });

  it("offers Edit, Delete and Close for an open case", () => {
    setup();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close this case" }),
    ).toBeInTheDocument();
  });

  it("hides the buttons and says so when the case is finished", () => {
    setup({ status: "COMPLETED" });
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /can no longer be changed/i,
    );
  });

  it("shows when and why a closed case was closed", () => {
    setup({
      status: "CLOSED",
      closed_at: "2026-10-20T01:00:00Z",
      closed_reason: "Started by mistake",
    });
    expect(screen.getByRole("status")).toHaveTextContent(/Started by mistake/);
  });

  it("closes when Escape is pressed", async () => {
    const { onClose } = setup();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the dark background is clicked, but not the box itself", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("dialog").parentElement as HTMLElement,
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("opens the edit form", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit the case")).toBeInTheDocument();
  });

  it("asks before deleting, and Keep it goes back", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText(/this cannot be undone/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.getByText("Case details")).toBeInTheDocument();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("deletes the case after confirming", async () => {
    mockRemove.mockResolvedValue(undefined);
    const { onDeleted } = setup({ case_id: "c9" });
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("c9"));
    expect(mockRemove).toHaveBeenCalledWith("c9");
  });

  it("shows the error and keeps the case when delete fails", async () => {
    mockRemove.mockRejectedValue(new ApiError(500, "Server is down"));
    const { onDeleted } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByText("Server is down")).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
