import type { Todo, TodoCategory } from "@/types/api";
import { api } from "./apiClient";

export const todoService = {
  list: ({ limit = 50, category }: { limit?: number; category?: TodoCategory } = {}) =>
    api.get<Todo[]>("/todos", { limit, category }),
};
