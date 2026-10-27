import { request } from "@/lib/api";
import {
  professionalName,
  professionalsApi,
  specialtyLabel,
} from "@/lib/professionals";

jest.mock("@/lib/api", () => ({ request: jest.fn() }));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue([]);
});

describe("professionalsApi", () => {
  it("asks only for active specialists", async () => {
    await professionalsApi.listActive();
    expect(mockRequest).toHaveBeenCalledWith("/professionals?is_active=true");
  });
});

describe("labels", () => {
  it("names the specialty and the person", () => {
    expect(specialtyLabel("PSYCHIATRIST")).toBe("Psychiatrist");
    expect(specialtyLabel("PSYCHOLOGIST")).toBe("Psychologist");
    expect(
      professionalName({ first_name: "Wanjiru", last_name: "Mbugua" }),
    ).toBe("Wanjiru Mbugua");
  });
});
