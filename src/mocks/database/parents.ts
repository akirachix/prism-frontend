import type { Answers, Invitation, ParentChild, User } from "@/types/api";
import { listStatusOf, studentDetails, studentOfCase } from "./students";

export const MOCK_INVITATIONS: Record<string, Invitation> = {
  "mock-invite": {
    token: "mock-invite",
    school_name: "GreenField Academy",
    parent_first_name: "Grace",
    child_first_name: "Amani",
    email: "grace.achieng@example.com",
    expires_at: "2099-12-31T23:59:59Z",
  },
  "used-invite": {
    token: "used-invite",
    school_name: "GreenField Academy",
    parent_first_name: "Peter",
    child_first_name: "Grace",
    email: "peter.mwangi@example.com",
    expires_at: "2020-01-01T00:00:00Z",
  },
};

export function childForParent(studentId: string): ParentChild | null {
  const d = studentDetails(studentId);
  if (!d) return null;
  const n = Number(studentId.slice(-2));
  return {
    student_id: d.student_id,
    first_name: d.first_name,
    last_name: d.last_name,
    date_of_birth:
      d.date_of_birth ||
      `2019-${String((n % 12) + 1).padStart(2, "0")}-${String(n + 9).padStart(2, "0")}`,
    class_name: d.class_name || "Grade 1",
    admission_number: d.admission_number,

    status: listStatusOf(d.case).status,
    parent_screening: d.case?.parent_screening ?? "not_started",
    case_id: d.case?.case_id || null,
    next_check_date: d.case?.plan === "approved" ? d.case.six_week_check_at : null,
    plan_ends_at: d.case?.plan === "approved" ? (d.case.plan_ends_at ?? null) : null,
  };
}

export interface MockParent {
  password?: string;
  temporaryPassword?: string;
  invitation?: string;
  children: string[];
  user: User;
  awaitingCode?: boolean;
}

export const MOCK_PARENTS: Record<string, MockParent> = {
  "grace.achieng@example.com": {
    temporaryPassword: "Parent123!",
    invitation: "mock-invite",
    children: ["s0000000-0000-4000-8000-000000000001"],
    user: {
      user_id: "p-grace",
      first_name: "Grace",
      last_name: "Achieng",
      email: "grace.achieng@example.com",
      role: "parent",
    },
  },
  "peter.mwangi@example.com": {
    password: "Parent456!",
    children: ["s0000000-0000-4000-8000-000000000002"],
    user: {
      user_id: "p-peter",
      first_name: "Peter",
      last_name: "Mwangi",
      email: "peter.mwangi@example.com",
      role: "parent",
    },
  },
  "ann.mutua@example.com": {
    password: "Parent789!",

    children: ["s0000000-0000-4000-8000-000000000008", "s0000000-0000-4000-8000-000000000006"],
    user: {
      user_id: "p-ann",
      first_name: "Ann",
      last_name: "Mutua",
      email: "ann.mutua@example.com",
      role: "parent",
    },
  },
};

export let accounts: Record<string, MockParent> = {};
export let accepted: Record<string, { consents: string[]; accepted_at: string }> = {};
export let resent: string[] = [];
export let screeningAnswers: Record<string, Answers> = {};
export function resetParents() {
  accounts = JSON.parse(JSON.stringify(MOCK_PARENTS));
  accepted = {};
  resent = [];
  screeningAnswers = {};
}
resetParents();
export const parentAccount = (email: string): MockParent | undefined => accounts[email];

export const tokenFor = (parent: MockParent) => `mock-parent-token:${parent.user.user_id}`;
export function signedInParent(request: Request): MockParent | undefined {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer /, "");
  return Object.values(accounts).find((a) => tokenFor(a) === token);
}

export const parentAnswersOf = (caseId: string): Answers => screeningAnswers[caseId] || {};

export function parentAccessToChild(
  request: Request,
  studentId: string,
): "ok" | "signed-out" | "not-theirs" {
  const parent = signedInParent(request);
  if (!parent) return "signed-out";
  return parent.children.includes(studentId) ? "ok" : "not-theirs";
}

export const parentChildOf = (studentId: string) => childForParent(studentId);

export function parentAccessTo(
  request: Request,
  caseId: string,
): "ok" | "signed-out" | "not-theirs" {
  const parent = signedInParent(request);
  if (!parent) return "signed-out";
  const entry = studentOfCase(caseId);
  return entry && parent.children.includes(entry.student_id) ? "ok" : "not-theirs";
}

export const resentInvitations = () => resent;
export const acceptedInvitation = (token: string) => accepted[token] || null;
