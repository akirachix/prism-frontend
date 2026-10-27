import { request } from "@/lib/api";
import {
  auditApi,
  describeAudit,
  logAudit,
  type AuditEntry,
} from "@/lib/audit";
import { notificationsApi } from "@/lib/notifications";

type SessionUser = {
  user_id: string;
  school_id: string;
  role: string;
};

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SessionUser;
};

let currentSession: Session | null = null;

function setSession(s: Session | null) {
  currentSession = s;
}

jest.mock("@/lib/session", () => ({
  getSession: () => currentSession,
  setSession: (s: Session | null) => {
    currentSession = s;
  },
  TEACHER_ID: "t1",
}));

jest.mock("../../lib/session", () => ({
  getSession: () => currentSession,
  setSession: (s: Session | null) => {
    currentSession = s;
  },
  TEACHER_ID: "t1",
}));

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  request: jest.fn(),
}));

const mockRequest = request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue([]);
  setSession(null);
});

const entry = (overrides: Partial<AuditEntry>): AuditEntry => ({
  audit_id: "a1",
  user_id: "t1",
  actor_role: "TEACHER",
  action: "APPROVE",
  resource_type: "iep",
  resource_id: "c1",
  details: null,
  created_at: "2026-10-20T08:00:00Z",
  ...overrides,
});

describe("logAudit", () => {
  it("records who did what to which record", async () => {
    setSession({
      access_token: "A",
      refresh_token: "R",
      expires_at: 0,
      user: { user_id: "t1", school_id: "s1", role: "TEACHER" },
    });
    logAudit("UPDATE", "case", "c1", { action: "close" });
    const [path, options] = mockRequest.mock.calls[0];
    expect(path).toBe("/audit-logs");
    expect(JSON.parse(options.body)).toEqual({
      action: "UPDATE",
      resource_type: "case",
      resource_id: "c1",
      details: { action: "close" },
      user_id: "t1",
      school_id: "s1",
      actor_role: "TEACHER",
    });
  });

  it("never throws when the log call fails", () => {
    mockRequest.mockRejectedValue(new Error("down"));
    expect(() => logAudit("VIEW", "case", "c1")).not.toThrow();
  });
});

describe("case history", () => {
  it("lists a record's history newest first", async () => {
    mockRequest.mockResolvedValue([
      entry({ audit_id: "old", created_at: "2026-10-01T00:00:00Z" }),
      entry({ audit_id: "new", created_at: "2026-10-02T00:00:00Z" }),
    ]);
    const list = await auditApi.forResource("c1");
    expect(mockRequest).toHaveBeenCalledWith("/audit-logs?resource_id=c1");
    expect(list.map((e) => e.audit_id)).toEqual(["new", "old"]);
  });

  it("describes entries in plain words", () => {
    expect(describeAudit(entry({}))).toBe(
      "Approved the plan (IEP) by the teacher",
    );
    expect(
      describeAudit(
        entry({ action: "UPDATE", resource_type: "case", actor_role: null }),
      ),
    ).toBe("Updated the case");
  });
});

describe("notificationsApi", () => {
  it("lists a person's latest notifications", async () => {
    await notificationsApi.list("u1");
    expect(mockRequest).toHaveBeenCalledWith("/notifications?user_id=u1");
  });

  it("marks one as read", async () => {
    await notificationsApi.markRead("n1");
    expect(mockRequest).toHaveBeenCalledWith("/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ is_read: true }),
    });
  });
});
