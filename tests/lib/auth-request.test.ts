import { request } from "@/lib/api";
import { getSession, setSession } from "@/lib/session";
import type { UserRead } from "@/lib/users";

const fetchMock = jest.fn();

const user = { user_id: "u1", role: "TEACHER" } as UserRead;

function reply(status: number, body?: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  setSession(null);
});

describe("request with a session", () => {
  it("sends the access token", async () => {
    setSession({
      access_token: "A1",
      refresh_token: "R1",
      expires_at: 0,
      user,
    });
    fetchMock.mockResolvedValue(reply(200, []));
    await request("/cases");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer A1");
  });

  it("never sends the token to sign-in endpoints", async () => {
    setSession({
      access_token: "A1",
      refresh_token: "R1",
      expires_at: 0,
      user,
    });
    fetchMock.mockResolvedValue(reply(200, {}));
    await request("/auth/login", { method: "POST", body: "{}" });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    setSession({
      access_token: "OLD",
      refresh_token: "R1",
      expires_at: 0,
      user,
    });
    fetchMock
      .mockResolvedValueOnce(reply(401, { detail: "expired" }))
      .mockResolvedValueOnce(
        reply(200, {
          access_token: "NEW",
          refresh_token: "R2",
          expires_in: 60,
          user,
        }),
      )
      .mockResolvedValueOnce(reply(200, [1]));
    await expect(request("/cases")).resolves.toEqual([1]);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/refresh$/);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer NEW");
    expect(getSession()?.refresh_token).toBe("R2");
  });

  it("signs out when the refresh fails", async () => {
    setSession({
      access_token: "OLD",
      refresh_token: "R1",
      expires_at: 0,
      user,
    });
    fetchMock
      .mockResolvedValueOnce(reply(401, { detail: "expired" }))
      .mockResolvedValueOnce(reply(401, { detail: "revoked" }));
    await expect(request("/cases")).rejects.toMatchObject({ status: 401 });
    expect(getSession()).toBeNull();
  });
});
