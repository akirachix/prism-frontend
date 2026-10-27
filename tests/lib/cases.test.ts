import { request } from "@/lib/api";
import { casesApi } from "@/lib/cases";

jest.mock("@/lib/api", () => ({ request: jest.fn() }));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

describe("casesApi", () => {
  it("lists cases", async () => {
    await casesApi.list();
    expect(mockRequest).toHaveBeenCalledWith("/cases");
  });

  it("gets one case by id", async () => {
    await casesApi.get("c1");
    expect(mockRequest).toHaveBeenCalledWith("/cases/c1");
  });

  it("creates a case with POST and the body", async () => {
    const data = { school_id: "s1", student_id: "st1", initiated_by: "t1" };
    await casesApi.create(data);
    expect(mockRequest).toHaveBeenCalledWith("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

  it("updates a case with PATCH and only the given fields", async () => {
    await casesApi.update("c1", { status: "CLOSED" });
    expect(mockRequest).toHaveBeenCalledWith("/cases/c1", {
      method: "PATCH",
      body: JSON.stringify({ status: "CLOSED" }),
    });
  });

  it("deletes a case with DELETE", async () => {
    await casesApi.remove("c1");
    expect(mockRequest).toHaveBeenCalledWith("/cases/c1", { method: "DELETE" });
  });

  it("closes a case by sending the reason", async () => {
    await casesApi.close("c1", "Started by mistake");
    expect(mockRequest).toHaveBeenCalledWith("/cases/c1/close", {
      method: "POST",
      body: JSON.stringify({ reason: "Started by mistake" }),
    });
  });
});
