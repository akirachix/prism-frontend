import { http, HttpResponse } from "msw";

import { API_BASE_URL } from "@/config";
import { ApiError, api } from "@/services/apiClient";
import { applyServerErrors } from "@/services/formErrors";
import { server } from "./server";

describe("apiClient", () => {
  test("turns FastAPI 422 validation errors into field errors", async () => {
    server.use(
      http.patch(`${API_BASE_URL}/professionals/abc`, () =>
        HttpResponse.json(
          {
            detail: [
              { loc: ["body", "first_name"], msg: "Value error, must not be null" },
              { loc: ["body", "last_name"], msg: "Value error, must be 1 to 150 characters" },
            ],
          },
          { status: 422 },
        ),
      ),
    );

    const error = (await api
      .patch("/professionals/abc", { first_name: null })
      .catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({
      first_name: "must not be null",
      last_name: "must be 1 to 150 characters",
    });

    const setError = jest.fn();

    expect(applyServerErrors(error, setError)).toBeNull();
    expect(setError).toHaveBeenCalledWith("first_name", {
      type: "server",
      message: "must not be null",
    });
  });

  test("uses the backend message for 404 and 409", async () => {
    server.use(
      http.delete(`${API_BASE_URL}/professionals/abc`, () =>
        HttpResponse.json({ detail: "This professional is in use." }, { status: 409 }),
      ),
    );
    const error = (await api.delete("/professionals/abc").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(409);
    expect(error.message).toBe("This professional is in use.");
  });

  test("returns null for 204 No Content", async () => {
    server.use(
      http.delete(
        `${API_BASE_URL}/professionals/abc`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    await expect(api.delete("/professionals/abc")).resolves.toBeNull();
  });

  test("gives a friendly message when the server can't be reached", async () => {
    server.use(http.get(`${API_BASE_URL}/health`, () => HttpResponse.error()));
    const error = (await api.get("/health").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/can't reach the server/i);
  });
});
