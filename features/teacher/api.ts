import { getStoredUser } from "@/features/auth";
import { fromSource } from "@/lib/data-source";
import { api, ApiError } from "@/lib/http";
import { pendingEndpoint } from "@/lib/pending";
import type { CaseRead, IepRead, NotificationRead } from "@/lib/api-types";
import {
  toActivity,
  toAttention,
  toStats,
  toStudentRows,
  toTodos,
} from "./adapters";
import { teacherEndpoints as e } from "./endpoints";
import type {
  NewStudentPayload,
  StudentList,
  TeacherHomeData,
  TodoItem,
} from "./types";

const mocks = () => import("./mocks");

function requireUserId(): string {
  const id = getStoredUser()?.id;
  if (!id) throw new ApiError("Please sign in again.", 401);
  return id;
}

const myCases = (userId: string) =>
  api.get<CaseRead[]>(e.cases, {
    params: { initiated_by: userId, limit: 200 },
  });

async function myIeps(cases: CaseRead[]): Promise<IepRead[]> {
  const ids = new Set(cases.map((c) => c.case_id));
  if (ids.size === 0) return [];
  const all = await api.get<IepRead[]>(e.ieps, { params: { limit: 200 } });
  return all.filter((iep) => ids.has(iep.case_id));
}

export const teacherApi = {
  home: (): Promise<TeacherHomeData> =>
    fromSource({
      api: async () => {
        const userId = requireUserId();
        const [cases, notifications] = await Promise.all([
          myCases(userId),
          api.get<NotificationRead[]>(e.notifications, {
            params: { user_id: userId, limit: 5 },
          }),
        ]);
        const ieps = await myIeps(cases);
        return {
          stats: toStats(cases, ieps),
          needsAttention: toAttention(
            ieps,
            new Map(cases.map((c) => [c.case_id, c])),
          ),
          latestActions: toActivity(notifications),
        };
      },
      mock: async () => (await mocks()).mockHome,
    }),

  students: (): Promise<StudentList> =>
    fromSource<StudentList>({
      api: async () => ({
        students: toStudentRows(await myCases(requireUserId())),
        namesPending: true,
      }),
      mock: async () => ({
        students: (await mocks()).mockStudents,
        namesPending: false,
      }),
    }),

  addStudent: (payload: NewStudentPayload): Promise<void> =>
    fromSource({
      api: () => pendingEndpoint("Adding a student"),
      mock: async () => (await mocks()).mockAddStudent(payload),
    }),

  todos: (): Promise<TodoItem[]> =>
    fromSource({
      api: async () => {
        const cases = await myCases(requireUserId());
        return toTodos(cases, await myIeps(cases));
      },
      mock: async () => (await mocks()).mockTodos,
    }),
};
