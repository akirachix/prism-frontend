import { ApiError, request } from "@/lib/api";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function reply(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new Error("no body");
      return body;
    },
  };
}

async function failure(): Promise<ApiError> {
  try {
    await request("/x");
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("expected the request to fail");
}

describe("request", () => {
  it("returns the parsed JSON on success", async () => {
    fetchMock.mockResolvedValue(reply(200, { a: 1 }));
    await expect(request("/x")).resolves.toEqual({ a: 1 });
  });

  it("calls the right path with JSON headers and no caching", async () => {
    fetchMock.mockResolvedValue(reply(200, []));
    await request("/cases");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/cases$/);
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(options.cache).toBe("no-store");
  });

  it("passes the method and body through", async () => {
    fetchMock.mockResolvedValue(reply(201, {}));
    await request("/cases", { method: "POST", body: "{}" });
    const options = fetchMock.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.body).toBe("{}");
  });

  it("returns nothing for a 204 response", async () => {
    fetchMock.mockResolvedValue(reply(204));
    await expect(request("/x")).resolves.toBeUndefined();
  });

  it("uses the message the backend sent", async () => {
    fetchMock.mockResolvedValue(
      reply(409, { detail: "This token is already revoked." }),
    );
    const error = await failure();
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe("This token is already revoked.");
  });

  it("uses a safe default when the error has no readable body", async () => {
    fetchMock.mockResolvedValue(reply(500));
    const error = await failure();
    expect(error.status).toBe(500);
    expect(error.message).toBe("Something went wrong. Please try again.");
  });

  it("uses the default when detail is a list instead of text", async () => {
    fetchMock.mockResolvedValue(reply(422, { detail: [{ msg: "bad" }] }));
    const error = await failure();
    expect(error.message).toBe("Something went wrong. Please try again.");
  });

  it("explains when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await failure();
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/could not reach the server/i);
  });
});
