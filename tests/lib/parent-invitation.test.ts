import { request } from "@/lib/api";
import {
  childrenLabel,
  consentText,
  invitationStepHref,
  parentInvitationApi,
  type ParentInvitation,
} from "@/lib/parent-invitation";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({});
});

function body(call: number) {
  return JSON.parse(mockRequest.mock.calls[call][1].body);
}

describe("parentInvitationApi", () => {
  it("reads the invitation with the token", async () => {
    await parentInvitationApi.details("tok-123456");
    expect(mockRequest.mock.calls[0][0]).toBe("/students/parent-invitation");
    expect(mockRequest.mock.calls[0][1].method).toBe("POST");
    expect(body(0)).toEqual({ token: "tok-123456" });
  });

  it("checks the parent's email against the invitation", async () => {
    await parentInvitationApi.verifyEmail("tok-123456", "eva@example.com");
    expect(mockRequest.mock.calls[0][0]).toBe(
      "/students/parent-invitation/verify-email",
    );
    expect(body(0)).toEqual({ token: "tok-123456", email: "eva@example.com" });
  });

  it("accepts the invitation on the parent endpoint, not the staff one", async () => {
    await parentInvitationApi.accept({
      token: "tok-123456",
      email: "eva@example.com",
      first_name: "Eva",
      last_name: "Otieno",
      new_password: "secret123",
      consent: { screening: true, data_use: true, not_diagnostic: true },
    });
    expect(mockRequest.mock.calls[0][0]).toBe(
      "/students/parent-invitation/accept",
    );
    expect(body(0)).toEqual({
      token: "tok-123456",
      email: "eva@example.com",
      first_name: "Eva",
      last_name: "Otieno",
      new_password: "secret123",
      consent: { screening: true, data_use: true, not_diagnostic: true },
    });
  });
});

describe("invitation helpers", () => {
  it("carries the token and email to the next step", () => {
    expect(invitationStepHref("welcome", "a b")).toBe(
      "/parent/welcome?token=a+b",
    );
    expect(invitationStepHref("set-password", "t1", "eva@example.com")).toBe(
      "/parent/set-password?token=t1&email=eva%40example.com",
    );
  });

  it("names one or more children", () => {
    expect(childrenLabel([])).toBe("your child");
    expect(childrenLabel(["Amina"])).toBe("Amina");
    expect(childrenLabel(["Amina", "Baraka", "Chausiku"])).toBe(
      "Amina, Baraka and Chausiku",
    );
  });

  it("uses the school's consent text when it is given", () => {
    const invitation: ParentInvitation = {
      school_name: "Hillside",
      parent_first_name: "Eva",
      children: ["Amina"],
      expires_at: "2026-11-08T00:00:00Z",
      consent_statements: { screening: "School text" },
    };
    expect(consentText(invitation, "screening")).toBe("School text");
    expect(consentText(invitation, "data_use")).toMatch(/store and use/);
  });
});
