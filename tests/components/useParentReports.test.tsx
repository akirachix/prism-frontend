import { act, renderHook, waitFor } from "@testing-library/react";

import { useParentReports } from "@/app/parent/_components/reports/useParentReports";
import { ApiError } from "@/lib/api";
import { loadParentReports, loadReportChild } from "@/lib/reports";

jest.mock("@/lib/reports", () => ({
  loadReportChild: jest.fn(),
  loadParentReports: jest.fn(),
}));

const mockChild = loadReportChild as jest.Mock;
const mockReports = loadParentReports as jest.Mock;

const none = {
  screening: undefined,
  plan: undefined,
  recommendation: undefined,
};

function childFor(caseId: string, name: string) {
  return {
    caseItem: { case_id: caseId, student_id: `s-${caseId}` },
    student: { student_id: `s-${caseId}`, first_name: name, last_name: "Test" },
  };
}

function reportsFor(caseId: string) {
  return {
    reports: {
      screening: { report_id: `r-${caseId}` },
      plan: null,
      recommendation: null,
    },
    errors: none,
  };
}

beforeEach(() => {
  mockChild.mockReset();
  mockReports.mockReset();
  mockChild.mockImplementation(async (caseId: string) =>
    childFor(caseId, caseId === "c1" ? "Faith" : "Amani"),
  );
  mockReports.mockImplementation(async (caseId: string) => reportsFor(caseId));
});

describe("useParentReports", () => {
  it("loads the child and the reports for the case", async () => {
    const { result } = renderHook(() => useParentReports("c1"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.child?.student.first_name).toBe("Faith");
    expect(result.current.reports?.screening).toEqual({ report_id: "r-c1" });
    expect(result.current.childError).toBeNull();
  });

  it("drops the previous case straight away when the case changes", async () => {
    const { result, rerender } = renderHook(({ id }) => useParentReports(id), {
      initialProps: { id: "c1" },
    });
    await waitFor(() =>
      expect(result.current.child?.student.first_name).toBe("Faith"),
    );

    let finishSecond: () => void = () => {};
    mockChild.mockImplementation(
      (caseId: string) =>
        new Promise((resolve) => {
          finishSecond = () => resolve(childFor(caseId, "Amani"));
        }),
    );
    rerender({ id: "c2" });

    // Before c2 has loaded, nothing from c1 is left.
    expect(result.current.loading).toBe(true);
    expect(result.current.child).toBeNull();
    expect(result.current.reports).toBeNull();

    await act(async () => finishSecond());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.child?.student.first_name).toBe("Amani");
    expect(result.current.caseId).toBe("c2");
  });

  it("ignores a slow answer for a case that is no longer shown", async () => {
    let finishFirst: () => void = () => {};
    mockChild.mockImplementationOnce(
      (caseId: string) =>
        new Promise((resolve) => {
          finishFirst = () => resolve(childFor(caseId, "Faith"));
        }),
    );
    const { result, rerender } = renderHook(({ id }) => useParentReports(id), {
      initialProps: { id: "c1" },
    });
    rerender({ id: "c2" });
    await waitFor(() =>
      expect(result.current.child?.student.first_name).toBe("Amani"),
    );
    await act(async () => finishFirst());
    expect(result.current.child?.student.first_name).toBe("Amani");
  });

  it("shows a child lookup error instead of an unnamed report, and retries", async () => {
    mockChild.mockRejectedValueOnce(
      new ApiError(503, "Students are unavailable."),
    );
    const { result } = renderHook(() => useParentReports("c1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.child).toBeNull();
    expect(result.current.childError).toBe("Students are unavailable.");

    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    expect(result.current.childError).toBeNull();
    await waitFor(() =>
      expect(result.current.child?.student.first_name).toBe("Faith"),
    );
    expect(mockChild).toHaveBeenCalledTimes(2);
    expect(mockReports).toHaveBeenCalledTimes(2);
  });

  it("does nothing without a case", () => {
    const { result } = renderHook(() => useParentReports(null));
    expect(result.current.loading).toBe(false);
    expect(mockChild).not.toHaveBeenCalled();
  });
});
