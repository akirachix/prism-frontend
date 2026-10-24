import { fetchAll, MAX_PAGE_SIZE } from "@/lib/api";
import { attentionItems, loadClassroom } from "@/lib/classroom";
import type { IEP } from "@/lib/ieps";
import { makeCase, makeStudent } from "../helpers";

describe("fetchAll", () => {
  it("keeps fetching until a page comes back short", async () => {
    const rows = Array.from({ length: 450 }, (_, i) => i);
    const fetchPage = jest.fn(async (limit: number, offset: number) =>
      rows.slice(offset, offset + limit),
    );

    await expect(fetchAll(fetchPage)).resolves.toEqual(rows);
    expect(fetchPage.mock.calls).toEqual([
      [MAX_PAGE_SIZE, 0],
      [MAX_PAGE_SIZE, 200],
      [MAX_PAGE_SIZE, 400],
    ]);
  });

  it("asks for one more page when the last page is exactly full", async () => {
    const rows = Array.from({ length: 4 }, (_, i) => i);
    const fetchPage = jest.fn(async (limit: number, offset: number) =>
      rows.slice(offset, offset + limit),
    );

    await expect(fetchAll(fetchPage, 2)).resolves.toEqual(rows);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("returns an empty list when there is nothing", async () => {
    await expect(fetchAll(async () => [])).resolves.toEqual([]);
  });
});

describe("loadClassroom pagination", () => {
  const fetchMock = jest.fn();

  function makeIep(overrides: Partial<IEP>): IEP {
    return {
      iep_id: "i1",
      case_id: "c1",
      version_number: 1,
      status: "PENDING_APPROVAL",
      generated_content: "",
      rag_file_references: [],
      short_term_goals: [],
      strategies: [],
      generated_by: "AI",
      teacher_approved: false,
      teacher_approved_by: null,
      admin_approved: false,
      admin_approved_by: null,
      rejection_reason: null,
      approved_at: null,
      evaluation_unlock_date: null,
      created_by: "t1",
      created_at: "2026-10-20T01:00:00Z",
      superseded_at: null,
      ...overrides,
    };
  }

  /** A fake backend that honours limit/offset like the real one. */
  function serve(tables: Record<string, unknown[]>) {
    fetchMock.mockImplementation(async (input: string) => {
      const url = new URL(input, "http://api.test");
      const status = url.searchParams.get("status");
      const key = status ? `${url.pathname}?${status}` : url.pathname;
      const all = tables[key] ?? [];
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return {
        ok: true,
        status: 200,
        json: async () => all.slice(offset, offset + limit),
      };
    });
  }

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("finds a pending IEP that sits beyond the first page", async () => {
    const students = Array.from({ length: 250 }, (_, i) =>
      makeStudent({ student_id: `s${i}`, first_name: `Kid${i}` }),
    );
    const cases = students.map((s, i) =>
      makeCase({ case_id: `c${i}`, student_id: s.student_id }),
    );
    // Lots of other schools' IEPs first, so ours is on page 2.
    const others = Array.from({ length: 230 }, (_, i) =>
      makeIep({ iep_id: `other${i}`, case_id: `elsewhere${i}` }),
    );
    const mine = makeIep({ iep_id: "mine", case_id: "c249" });

    serve({
      "/students": students,
      "/cases": cases,
      "/ieps?PENDING_APPROVAL": [...others, mine],
    });

    const room = await loadClassroom("t1");

    expect(room.students).toHaveLength(250);
    expect(room.cases).toHaveLength(250);
    expect(room.iepByCase.get("c249")?.iep_id).toBe("mine");
    expect(attentionItems(room).some((item) => item.id === "iep-mine")).toBe(
      true,
    );
  });
});
