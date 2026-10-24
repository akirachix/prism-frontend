import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EditCaseForm from "@/app/teacher/_components/cases/EditCaseForm";
import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { makeCase } from "@/tests/helpers";

jest.mock("@/lib/cases", () => ({ casesApi: { update: jest.fn() } }));

const mockUpdate = casesApi.update as jest.Mock;

function setup(overrides = {}) {
  const props = {
    item: makeCase(overrides),
    onBack: jest.fn(),
    onSaved: jest.fn(),
  };
  render(<EditCaseForm {...props} />);
  return props;
}

const save = () =>
  userEvent.click(screen.getByRole("button", { name: "Save changes" }));

beforeEach(() => mockUpdate.mockReset());

describe("EditCaseForm", () => {
  it("starts with the case's current status", () => {
    setup();
    expect(screen.getByLabelText("Where the case is")).toHaveValue("INITIATED");
  });

  it("refuses to save when nothing changed", async () => {
    setup();
    await save();
    expect(
      await screen.findByText("You have not changed anything."),
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sends only the status when only the status changed", async () => {
    const updated = makeCase({ status: "CLOSED" });
    mockUpdate.mockResolvedValue(updated);
    const { onSaved } = setup();
    await userEvent.selectOptions(
      screen.getByLabelText("Where the case is"),
      "CLOSED",
    );
    await save();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
    expect(mockUpdate).toHaveBeenCalledWith("c1", { status: "CLOSED" });
  });

  it("sends a score as a number", async () => {
    mockUpdate.mockResolvedValue(makeCase({ autism_score: 4 }));
    setup();
    await userEvent.type(screen.getByLabelText("Autism score"), "4");
    await save();
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("c1", { autism_score: 4 }),
    );
  });

  it("shows the backend's message when saving fails", async () => {
    mockUpdate.mockRejectedValue(
      new ApiError(422, "Please fix the following. status: not valid"),
    );
    const { onSaved } = setup();
    await userEvent.selectOptions(
      screen.getByLabelText("Where the case is"),
      "CLOSED",
    );
    await save();
    expect(
      await screen.findByText(/Please fix the following/),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("goes back when Cancel is clicked", async () => {
    const { onBack } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("still shows a status the form does not know about", () => {
    setup({ status: "IN_REVIEW" });
    expect(
      screen.getByRole("option", { name: /in review/i }),
    ).toBeInTheDocument();
  });
});
