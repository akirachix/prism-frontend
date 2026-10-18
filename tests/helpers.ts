import { MOCK_STUDENTS } from "@/mocks/database/students";
import { findCase } from "@/mocks/database/students";
import { getSession } from "@/services/session";
import type { CaseInfo, StudentRow, User } from "@/types/api";

export function studentNamed(first: string): StudentRow {
  const found = MOCK_STUDENTS.find((s) => s.first_name === first);
  if (!found) throw new Error(`No mock student called ${first}`);
  return found;
}

export const idOf = (first: string) => studentNamed(first).student_id;

export function caseNamed(caseId: string): CaseInfo {
  const found = findCase(caseId);
  if (!found) throw new Error(`No mock case ${caseId}`);
  return found;
}

export function signedInUser(): User {
  const session = getSession();
  if (!session) throw new Error("Nobody is signed in");
  return session.user;
}

export const textOf = (element: Element | null | undefined) => element?.textContent ?? "";

export const valueOf = (element: HTMLElement) => (element as HTMLInputElement).value;

export function closest(element: Element, selector: string): HTMLElement {
  const found = element.closest<HTMLElement>(selector);
  if (!found) throw new Error(`No ${selector} around this element`);
  return found;
}
