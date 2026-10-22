import { ApiError } from "@/lib/api";
import { saveScreening } from "@/lib/screening";
import { allQuestions, questionSetFor } from "@/lib/screening-questions";
import { makeCase } from "@/tests/helpers";

const fetchMock = jest.fn();
const set = questionSetFor(7);
const all = (value: number) =>
  Object.fromEntries(allQuestions(set).map((q) => [q.id, value]));

let stored: unknown = null;

function reply(status: number, body?: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  stored = null;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, options: RequestInit) => {
    const method = options.method ?? "GET";
    if (url.includes("/reports/case/") && method === "GET") {
      return stored
        ? reply(200, { report_id: "r", case_id: "c1", content: stored })
        : reply(404, { detail: "none" });
    }
    if (url.endsWith("/reports") || url.includes("/reports/case/")) {
      stored = JSON.parse(String(options.body)).content;
      return reply(200, {});
    }
    if (url.includes("/cases/"))
      return reply(200, makeCase(JSON.parse(String(options.body))));
    return reply(404);
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

function caseUpdates() {
  return fetchMock.mock.calls
    .filter(
      ([url, o]) => String(url).includes("/cases/") && o.method === "PATCH",
    )
    .map(([, o]) => JSON.parse(String(o.body)));
}

describe("saveScreening", () => {
  it("saves progress without moving the case on", async () => {
    await saveScreening({
      caseItem: makeCase(),
      role: "TEACHER",
      responderId: "t1",
      set,
      answers: { "aut-1": 0 },
      finish: false,
    });
    expect(caseUpdates()).toEqual([]);
    expect(
      fetchMock.mock.calls.some(
        ([url, o]) => String(url).endsWith("/reports") && o.method === "POST",
      ),
    ).toBe(true);
  });

  it("marks the teacher's side done when they finish first", async () => {
    await saveScreening({
      caseItem: makeCase(),
      role: "TEACHER",
      responderId: "t1",
      set,
      answers: all(0),
      finish: true,
    });
    expect(caseUpdates()[0].status).toBe("TEACHER_SCREENING_COMPLETED");
  });

  it("closes with no concern when both sides are low", async () => {
    await saveScreening({
      caseItem: makeCase(),
      role: "TEACHER",
      responderId: "t1",
      set,
      answers: all(0),
      finish: true,
    });
    await saveScreening({
      caseItem: makeCase(),
      role: "PARENT",
      responderId: "p1",
      set,
      answers: all(0),
      finish: true,
    });
    expect(caseUpdates()[1]).toMatchObject({
      status: "NO_CONCERN_IDENTIFIED",
      domain_density_score: 0,
    });
  });

  it("keeps the case open for a plan when a domain is elevated", async () => {
    await saveScreening({
      caseItem: makeCase(),
      role: "TEACHER",
      responderId: "t1",
      set,
      answers: all(3),
      finish: true,
    });
    await saveScreening({
      caseItem: makeCase(),
      role: "PARENT",
      responderId: "p1",
      set,
      answers: all(3),
      finish: true,
    });
    expect(caseUpdates()[1].status).toBe("PARENT_SCREENING_COMPLETED");
    expect(caseUpdates()[1].primary_domain).not.toBeNull();
  });

  it("passes on server errors other than 404", async () => {
    fetchMock.mockResolvedValueOnce(reply(500, { detail: "down" }));
    await expect(
      saveScreening({
        caseItem: makeCase(),
        role: "TEACHER",
        responderId: "t1",
        set,
        answers: {},
        finish: false,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
