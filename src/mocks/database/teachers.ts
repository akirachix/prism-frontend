import type { TeacherProfile, User } from "@/types/api";

export const MOCK_USER_ID = "11111111-1111-4111-8111-111111111111";

export const MOCK_TEACHER: { email: string; password: string; user: User } = {
  email: "teacher@mirai.test",
  password: "Teacher123!",
  user: {
    user_id: MOCK_USER_ID,
    first_name: "Mary",
    last_name: "Wanjiru",
    email: "teacher@mirai.test",
    role: "teacher",
    school_name: "Greenfield Academy",
  },
};

export const MOCK_OTP = "12345";

export const teacherStore: {
  account: { password: string; mustChangePassword: boolean };
  profile: TeacherProfile;
} = {
  account: { password: MOCK_TEACHER.password, mustChangePassword: true },
  profile: { ...MOCK_TEACHER.user, phone: "+254700000000" },
};
export function resetTeachers() {
  teacherStore.account = { password: MOCK_TEACHER.password, mustChangePassword: true };
  teacherStore.profile = { ...MOCK_TEACHER.user, phone: "+254700000000" };
}
