"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useUser } from "@/app/_components/SessionProvider";
import { useLoad } from "@/app/_components/useLoad";
import { casesApi, latestCase } from "@/lib/cases";
import { studentsApi, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";

interface Family {
  children: Student[];
  casesByChild: Map<string, Case | null>;
}

interface ChildValue {
  loading: boolean;
  error: string | null;
  children: Student[];
  child: Student | null;
  caseItem: Case | null;
  selectChild: (studentId: string) => void;
  reload: () => void;
}

const ChildContext = createContext<ChildValue | null>(null);

async function loadFamily(parentId: string): Promise<Family> {
  const children = await studentsApi.forParent(parentId);
  const lists = await Promise.all(
    children.map((child) => casesApi.listBy({ student_id: child.student_id })),
  );
  const casesByChild = new Map<string, Case | null>();
  children.forEach((child, i) =>
    casesByChild.set(child.student_id, latestCase(lists[i])),
  );
  return { children, casesByChild };
}

/** The parent's child (or children) and each child's current case. */
export default function ChildProvider({
  children: content,
}: {
  children: ReactNode;
}) {
  const user = useUser();
  const { data, error, loading, reload } = useLoad(
    () => loadFamily(user.user_id),
    [user.user_id],
  );
  const [selected, setSelected] = useState<string | null>(null);

  const value = useMemo<ChildValue>(() => {
    const kids = data?.children ?? [];
    const child =
      kids.find((kid) => kid.student_id === selected) ?? kids[0] ?? null;
    return {
      loading,
      error,
      children: kids,
      child,
      caseItem: child
        ? (data?.casesByChild.get(child.student_id) ?? null)
        : null,
      selectChild: setSelected,
      reload,
    };
  }, [data, error, loading, selected, reload]);

  return <ChildContext.Provider value={value}>{content}</ChildContext.Provider>;
}

export function useChild(): ChildValue {
  const value = useContext(ChildContext);
  if (!value) throw new Error("useChild must be used inside ChildProvider");
  return value;
}
