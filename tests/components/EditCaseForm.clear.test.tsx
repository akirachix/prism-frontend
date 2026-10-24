import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EditCaseForm from "@/app/teacher/_components/cases/EditCaseForm";
import { casesApi } from "@/lib/cases";
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
  autism_score: 5,
  adhd_score: null,
  dyslexia_score: null,
  domain_density_score: null,
  primary_domain: "AUTISM",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  closed_at: null,
  closed_reason: null,
} as unknown as Case;

function setup() {
  (casesApi.update as jest.Mock).mockResolvedValue(item);
  const onSaved = jest.fn();
  render(<EditCaseForm item={item} onBack={jest.fn()} onSaved={onSaved} />);
  return onSaved;
}

beforeEach(() => jest.clearAllMocks());

describe("EditCaseForm clearing values", () => {
  it("sends null when an existing score is emptied", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Autism score"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(casesApi.update).toHaveBeenCalledWith("case-1", {
        autism_score: null,
      }),
    );
  });

  it("sends null when the domain is set back to Not set", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Main area of concern"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(casesApi.update).toHaveBeenCalledWith("case-1", {
        primary_domain: null,
      }),
    );
  });

  it("sends a new number when a score changes", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Autism score"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(casesApi.update).toHaveBeenCalledWith("case-1", {
        autism_score: 7,
      }),
    );
  });

  it("does not send an empty score that was already empty", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Autism score"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(casesApi.update).toHaveBeenCalled());
    const body = (casesApi.update as jest.Mock).mock.calls[0][1];
    expect(body).not.toHaveProperty("adhd_score");
  });

  it("still says nothing changed when nothing changed", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("You have not changed anything.")).toBeTruthy();
    expect(casesApi.update).not.toHaveBeenCalled();
  });
});
