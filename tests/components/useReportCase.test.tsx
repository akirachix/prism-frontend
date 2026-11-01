import { renderHook } from "@testing-library/react";

import { useReportCase } from "@/app/parent/_components/reports/useReportCase";

const mockParams = { value: new URLSearchParams() };
const mockChild = {
  caseItem: null as { case_id: string } | null,
  loading: false,
  error: null as string | null,
  reload: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockParams.value,
}));
jest.mock("@/app/parent/_components/ChildProvider", () => ({
  useChild: () => mockChild,
}));

beforeEach(() => {
  mockParams.value = new URLSearchParams();
  mockChild.caseItem = null;
  mockChild.loading = false;
  mockChild.error = null;
  mockChild.reload.mockReset();
});

describe("useReportCase", () => {
  it("uses the case in the link", () => {
    mockParams.value = new URLSearchParams("case_id=c-link");
    mockChild.error = "Network error";
    const { result } = renderHook(() => useReportCase());
    expect(result.current.caseId).toBe("c-link");
    expect(result.current.error).toBeNull();
  });

  it("falls back to the selected child's case", () => {
    mockChild.caseItem = { case_id: "c-child" };
    const { result } = renderHook(() => useReportCase());
    expect(result.current.caseId).toBe("c-child");
  });

  it("passes on a loading error with a retry", () => {
    mockChild.error = "Network error";
    const { result } = renderHook(() => useReportCase());
    expect(result.current.error).toBe("Network error");
    expect(result.current.caseId).toBeNull();
    result.current.retry();
    expect(mockChild.reload).toHaveBeenCalledTimes(1);
  });
});
