import { query, request } from "@/lib/api";

export interface Student {
  student_id: string;
  school_id: string;
  school_name?: string | null;
  teacher_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  class_name?: string | null;
  parent_id?: string | null;
}

export interface StudentCreate {
  school_id: string;
  teacher_id: string;
  parent_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

const STUDENTS_PATH = "/students";

export function getStudents(teacherId?: string): Promise<Student[]> {
  const search = teacherId
    ? `?teacher_id=${teacherId}&limit=200`
    : "?limit=200";
  return request<Student[]>(`${STUDENTS_PATH}${search}`);
}

export const studentsApi = {
  get: (studentId: string) => request<Student>(`${STUDENTS_PATH}/${studentId}`),
  forParent: (parentId: string) =>
    request<Student[]>(
      `${STUDENTS_PATH}${query({ parent_id: parentId, limit: 50 })}`,
    ),
  create: (data: StudentCreate) =>
    request<Student>(STUDENTS_PATH, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export function studentName(student: Student): string {
  return `${student.first_name} ${student.last_name}`;
}

export function ageInYears(
  dateOfBirth: string | null | undefined,
): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
