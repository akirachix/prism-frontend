"use client";

import { useSearchParams } from "next/navigation";

import { ButtonLink } from "@/_components/ui/Button";

export default function ResetChooser() {
  const token = useSearchParams().get("token");
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return (
    <div className="home__actions">
      <ButtonLink href={`/teacher/reset-password${query}`} block>
        I am a teacher
      </ButtonLink>
      <ButtonLink
        href={`/parent/reset-password${query}`}
        variant="outline"
        block
      >
        I am a parent
      </ButtonLink>
    </div>
  );
}
