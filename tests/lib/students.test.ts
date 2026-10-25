import { request } from "@/lib/api";
import {
  ageInYears,
  birthDateLimits,
  isEligibleAge,
  studentsApi,
} from "@/lib/lookups";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;
const TODAY = new Date(2026, 9, 24); // 24 Oct 2026

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

describe("student ages", () => {
  it("counts whole years, before and after the birthday", () => {
    expect(ageInYears("2020-10-24", TODAY)).toBe(6);
    expect(ageInYears("2020-10-25", TODAY)).toBe(5);
    expect(ageInYears(null, TODAY)).toBeNull();
  });

  it("only children aged 4 to 9 are eligible", () => {
    expect(isEligibleAge("2022-10-24", TODAY)).toBe(true); // 4 today
    expect(isEligibleAge("2022-10-25", TODAY)).toBe(false); // 4 tomorrow
    expect(isEligibleAge("2016-10-25", TODAY)).toBe(true); // 9
    expect(isEligibleAge("2016-10-24", TODAY)).toBe(false); // 10 today
    expect(isEligibleAge("", TODAY)).toBe(false);
  });

  it("the calendar offers exactly the eligible birth dates", () => {
    expect(birthDateLimits(TODAY)).toEqual({
      min: "2016-10-25",
      max: "2022-10-24",
    });
  });
});

describe("studentsApi", () => {
  it("creates a student together with a new parent", async () => {
    await studentsApi.create({
      admission_number: "A-1",
      first_name: "Amina",
      last_name: "Otieno",
      date_of_birth: "2020-03-01",
      gender: "FEMALE",
      parent: { first_name: "Eva", last_name: "Otieno", email: "e@x.com" },
    });
    const [path, options] = mockRequest.mock.calls[0];
    expect(path).toBe("/students");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body).parent.email).toBe("e@x.com");
  });

  it("reads the parent's invitation status", async () => {
    await studentsApi.parentInvitation("s1");
    expect(mockRequest.mock.calls[0][0]).toBe("/students/s1/parent-invitation");
  });

  it("resends the invitation with POST", async () => {
    await studentsApi.resendParentInvitation("s1");
    const [path, options] = mockRequest.mock.calls[0];
    expect(path).toBe("/students/s1/resend-parent-invitation");
    expect(options.method).toBe("POST");
  });
});
