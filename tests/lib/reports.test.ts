import { ApiError, request } from "@/lib/api";
import { loadParentReports, loadReportChild, reportsApi } from "@/lib/reports";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

describe("reportsApi", () => {
  it("reads the case's screening report", async () => {
    await reportsApi.screening("c1");
    expect(mockRequest).toHaveBeenCalledWith("/reports/case/c1");
  });

  it("reads the approved plan", async () => {
    await reportsApi.plan("c1");
    expect(mockRequest).toHaveBeenCalledWith("/ieps/case/c1/active");
  });

  it("reads the home activities", async () => {
    await reportsApi.recommendation("c1");
    expect(mockRequest).toHaveBeenCalledWith("/recommendations/case/c1");
  });
});

describe("loadParentReports", () => {
  it("treats a missing report, plan or activity list as not ready yet", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/reports")) return { report_id: "r1" };
      throw new ApiError(404, "Not found");
    });
    await expect(loadParentReports("c1")).resolves.toEqual({
      reports: {
        screening: { report_id: "r1" },
        plan: null,
        recommendation: null,
      },
      errors: {
        screening: undefined,
        plan: undefined,
        recommendation: undefined,
      },
    });
  });

  it("returns partial results and preserves report errors when some requests fail", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/reports")) return { report_id: "r1" };
      if (path.startsWith("/ieps")) throw new ApiError(503, "Plan failed");
      throw new ApiError(404, "Not found");
    });

    await expect(loadParentReports("c1")).resolves.toEqual({
      reports: {
        screening: { report_id: "r1" },
        plan: null,
        recommendation: null,
      },
      errors: {
        screening: undefined,
        plan: "Plan failed",
        recommendation: undefined,
      },
    });
  });

  it("returns report errors when all requests fail", async () => {
    mockRequest.mockRejectedValue(new ApiError(500, "Server down"));
    await expect(loadParentReports("c1")).resolves.toMatchObject({
      errors: {
        screening: "Server down",
        plan: "Server down",
        recommendation: "Server down",
      },
    });
  });
});

describe("reportsApi.listAll", () => {
  it("asks for up to 100 reports", async () => {
    await reportsApi.listAll();
    expect(mockRequest).toHaveBeenCalledWith("/reports");
  });
});

describe("loadReportChild", () => {
  it("reads the case, then that child directly by id", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path === "/cases/c1") return { case_id: "c1", student_id: "s9" };
      if (path === "/students/s9")
        return { student_id: "s9", first_name: "Faith" };
      throw new Error(`unexpected ${path}`);
    });
    await expect(loadReportChild("c1")).resolves.toEqual({
      caseItem: { case_id: "c1", student_id: "s9" },
      student: { student_id: "s9", first_name: "Faith" },
    });
    expect(mockRequest).not.toHaveBeenCalledWith("/students");
  });

  it("fails when the child cannot be read, instead of returning no name", async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path === "/cases/c1") return { case_id: "c1", student_id: "s9" };
      throw new ApiError(403, "You cannot view this student.");
    });
    await expect(loadReportChild("c1")).rejects.toMatchObject({
      status: 403,
      message: "You cannot view this student.",
    });
  });
});
