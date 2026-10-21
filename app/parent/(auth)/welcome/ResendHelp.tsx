"use client";

import { useState } from "react";

import Button from "@/app/_components/ui/Button";
import { Alert } from "@/app/_components/ui/bits";

export default function ResendHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="auth-actions">
      <Button variant="link" onClick={() => setOpen(true)} aria-expanded={open}>
        Resend email
      </Button>
      {open && (
        <Alert tone="info">
          Ask your child&apos;s teacher to resend your invitation.
        </Alert>
      )}
    </div>
  );
}
