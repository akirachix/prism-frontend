import { request } from "@/lib/api";
import { waitForJob } from "@/lib/ai";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;
const noWait = { sleep: async () => {}, intervalMs: 1, timeoutMs: 3 };

beforeEach(() => mockRequest.mockReset());

describe("waitForJob", () => {
  it("polls until the job succeeds", async () => {
    mockRequest
      .mockResolvedValueOnce({ job_id: "j1", status: "PENDING" })
      .mockResolvedValueOnce({ job_id: "j1", status: "RUNNING" })
      .mockResolvedValueOnce({ job_id: "j1", status: "SUCCEEDED" });
    await expect(waitForJob("j1", noWait)).resolves.toMatchObject({
      status: "SUCCEEDED",
    });
    expect(mockRequest).toHaveBeenCalledTimes(3);
    expect(mockRequest).toHaveBeenCalledWith("/ai/jobs/j1");
  });

  it("stops with a clear message when the job fails", async () => {
    mockRequest.mockResolvedValue({ job_id: "j1", status: "FAILED" });
    await expect(waitForJob("j1", noWait)).rejects.toThrow(
      "The AI could not write the plan. Please try again.",
    );
  });

  it("gives up after the time limit", async () => {
    mockRequest.mockResolvedValue({ job_id: "j1", status: "RUNNING" });
    await expect(waitForJob("j1", noWait)).rejects.toThrow(
      "taking longer than usual",
    );
  });
});
