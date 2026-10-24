import { request } from "@/lib/api";
import { getStudents, studentName } from "@/lib/lookups";
import { makeStudent } from "@/tests/helpers";

jest.mock("@/lib/api", () => ({ request: jest.fn() }));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue([]);
});

describe("studentName", () => {
  it("includes the first and last name", () => {
    const name = studentName(makeStudent());
    expect(name).toContain("Amani");
    expect(name).toContain("Otieno");
  });
});

describe("getStudents", () => {
  it("asks the backend for up to 200 students", async () => {
    await getStudents();
    expect(mockRequest.mock.calls[0][0]).toBe("/students");
  });

  it("can ask for one teacher's students", async () => {
    await getStudents("t1");
    const path = mockRequest.mock.calls[0][0] as string;
    expect(path).toMatch(/teacher_id=t1/);
    expect(path).not.toMatch(/limit=/);
  });
});
