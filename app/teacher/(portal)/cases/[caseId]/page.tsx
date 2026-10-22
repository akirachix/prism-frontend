"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Alert, Loading } from "@/app/_components/ui/bits";
import { useLoad } from "@/app/_components/useLoad";
import { casesApi } from "@/lib/cases";

/** Links to a case (from notifications) open that student's page. */
export default function CaseRedirect() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { data, error } = useLoad(() => casesApi.get(caseId), [caseId]);

  useEffect(() => {
    if (data) router.replace(`/teacher/students/${data.student_id}`);
  }, [data, router]);

  return (
    <div className="ui-body">
      {error ? <Alert>{error}</Alert> : <Loading />}
    </div>
  );
}
