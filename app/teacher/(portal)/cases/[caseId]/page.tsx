"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Alert, Loading } from "@/_components/ui/bits";
import { useLoad } from "@/_components/useLoad";
import { casesApi } from "@/lib/cases";

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
