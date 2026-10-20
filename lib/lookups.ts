import { request } from "@/lib/api";

export interface Student {
  student_id: string;
  school_id: string;
  school_name?: string | null;
  teacher_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
}

const STUDENTS_PATH = "/students";

export function getStudents(teacherId?: string): Promise<Student[]> {
  const query = teacherId ? `?teacher_id=${teacherId}&limit=200` : "?limit=200";
  return request<Student[]>(`${STUDENTS_PATH}${query}`);
}

export function studentName(student: Student): string {
  return `${student.first_name} ${student.last_name}`;
}
