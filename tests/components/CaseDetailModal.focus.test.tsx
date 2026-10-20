import { fireEvent, render, screen } from "@testing-library/react";

import CaseDetailModal from "@/app/teacher/_components/CaseDetailModal";
import type { Case } from "@/lib/types";

jest.mock("@/lib/cases", () => ({
  casesApi: { update: jest.fn(), remove: jest.fn() },
}));

const item = {
  case_id: "case-1",
  student_id: "stu-1",
  school_id: "sch-1",
  initiated_by: "teacher-1",
  status: "INITIATED",
  autism_score: null,
  adhd_score: null,
  dyslexia_score: null,
  domain_density_score: null,
  primary_domain: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  closed_at: null,
  closed_reason: null,
} as unknown as Case;

function renderModal(onClose = jest.fn()) {
  return render(
    <CaseDetailModal
      item={item}
      onClose={onClose}
      onCaseChange={jest.fn()}
      onDeleted={jest.fn()}
    />,
  );
}

describe("CaseDetailModal focus handling", () => {
  it("moves focus into the dialog when it opens", () => {
    renderModal();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("wraps Tab from the last button to the first", () => {
    renderModal();
    screen.getByRole("button", { name: "Close this case" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close" }),
    );
  });

  it("wraps Shift+Tab from the first button to the last", () => {
    renderModal();
    screen.getByRole("button", { name: "Close" }).focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close this case" }),
    );
  });

  it("pulls focus back in if it was outside the dialog", () => {
    renderModal();
    document.body.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close" }),
    );
  });

  it("puts focus back on the opener when it closes", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = renderModal();
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("closes on Escape", () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps focus inside after switching to the edit view", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });
});
