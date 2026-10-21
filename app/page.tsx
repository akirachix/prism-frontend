"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const caseId = process.env.NEXT_PUBLIC_DEMO_CASE_ID;
    router.replace(
      caseId ? `/parent/reports?case_id=${caseId}` : "/parent/reports",
    );
  }, [router]);
  return null;
}
