import { query, request } from "@/lib/api";

export type Role = "SYSTEM_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";

export interface UserRead {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  school_id: string | null;
  role: Role;
  must_change_password: boolean;
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: Role;
  school_id?: string | null;
}

export interface UserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export const usersApi = {
  list: (limit = 200, offset = 0) =>
    request<UserRead[]>(`/users${query({ limit, offset })}`),
  get: (userId: string) => request<UserRead>(`/users/${userId}`),
  create: (data: UserCreate) =>
    request<UserRead>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (userId: string, data: UserUpdate) =>
    request<UserRead>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  resendInvitation: (userId: string) =>
    request<UserRead>(`/users/${userId}/resend-invitation`, { method: "POST" }),
};

export function fullName(user: Pick<UserRead, "first_name" | "last_name">) {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function hasSignedIn(user: UserRead): boolean {
  return !user.must_change_password;
}
