import type { ParentChild } from "@/types/api";
import { api } from "./apiClient";

export const childService = {
  listMine: () => api.get<ParentChild[]>("/parents/me/children"),
};
