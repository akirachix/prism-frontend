import { request } from "@/lib/api";
import { query } from "@/lib/query";

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
  is_active?: boolean;
  created_at?: string;
}

/** The parent a teacher adds with a student. They are emailed an invitation. */
export interface ParentIn {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
}

/**
 * What POST /students accepts. The school and the teacher come from the
 * signed-in teacher. Send either `parent_id` (an existing parent) or
 * `parent` (a new parent, who receives the invitation link).
 */
export interface StudentCreate {
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "MALE" | "FEMALE";
  parent_id?: string | null;
  parent?: ParentIn | null;
}

/** GET /students/{id}/parent-invitation: has the parent joined yet? */
export interface ParentInviteStatus {
  parent_email: string;
  accepted: boolean;
  resends_used: number;
  resends_left: number;
  max_resends: number;
}

/** POST /students/{id}/resend-parent-invitation. */
export interface ParentResendResult {
  detail: string;
  resends_left: number;
  max_resends: number;
}

const STUDENTS_PATH = "/students";

export function getStudents(
  teacherId?: string,
  limit?: number,
  offset = 0,
): Promise<Student[]> {
  return request<Student[]>(
    `${STUDENTS_PATH}${query({ teacher_id: teacherId, limit, offset: offset || undefined })}`,
  );
}

export const studentsApi = {
  get: (studentId: string) => request<Student>(`${STUDENTS_PATH}/${studentId}`),
  forParent: (parentId: string) =>
    request<Student[]>(`${STUDENTS_PATH}${query({ parent_id: parentId })}`),
  create: (data: StudentCreate) =>
    request<Student>(STUDENTS_PATH, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  parentInvitation: (studentId: string) =>
    request<ParentInviteStatus>(
      `${STUDENTS_PATH}/${studentId}/parent-invitation`,
    ),
  /** Emails the parent a new link. The server allows at most five resends. */
  resendParentInvitation: (studentId: string) =>
    request<ParentResendResult>(
      `${STUDENTS_PATH}/${studentId}/resend-parent-invitation`,
      { method: "POST" },
    ),
};

export function studentName(student: Student): string {
  return `${student.first_name} ${student.last_name}`;
}

/** "2019-05-10" is read as a local calendar day, never shifted by timezone. */
function parseDay(value: string): Date {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  return new Date(value);
}

export function ageInYears(
  dateOfBirth: string | null | undefined,
  now = new Date(),
): number | null {
  if (!dateOfBirth) return null;
  const born = parseDay(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Mirai screens children from 4 to 9 years old. */
export const MIN_STUDENT_AGE = 4;
export const MAX_STUDENT_AGE = 9;

export function isEligibleAge(
  dateOfBirth: string | null | undefined,
  now = new Date(),
): boolean {
  const age = ageInYears(dateOfBirth, now);
  return age !== null && age >= MIN_STUDENT_AGE && age <= MAX_STUDENT_AGE;
}

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  return `${date.getFullYear()}-${month}-${pad(date.getDate())}`;
}

/**
 * The first and last birth dates the calendar offers: a child who is at
 * least 4 and not yet 10 years old today.
 */
export function birthDateLimits(now = new Date()): {
  min: string;
  max: string;
} {
  const youngest = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  youngest.setFullYear(youngest.getFullYear() - MIN_STUDENT_AGE);
  const oldest = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  oldest.setFullYear(oldest.getFullYear() - (MAX_STUDENT_AGE + 1));
  oldest.setDate(oldest.getDate() + 1);
  return { min: isoDay(oldest), max: isoDay(youngest) };
}
