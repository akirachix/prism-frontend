"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { errorMessage } from "@/lib/api";
import {
  authApi,
  clearFlow,
  flowFromStage,
  flowPasswordInMemory,
  saveFlow,
  startSession,
  type AuthFlow,
  type MfaEnrollInfo,
  type Portal,
} from "@/lib/auth";
import { usersApi } from "@/lib/users";
import Button from "../ui/Button";
import { Alert, MailBadge } from "../ui/bits";
import OtpInput from "../ui/OtpInput";
import { useHydrated, useStoredFlow } from "../hooks";
import { landingFor } from "./flow";

const CODE_LENGTH = 6;

export default function VerifyForm({ portal }: { portal: Portal }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const hydrated = useHydrated();
  const stored = useStoredFlow();
  const [override, setFlow] = useState<AuthFlow | null>(null);
  const flow = override ?? stored;
  const usable =
    flow !== null &&
    flow.portal === portal &&
    flow.stage !== "password_change_required";
  const [enroll, setEnroll] = useState<MfaEnrollInfo | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const enrolled = useRef(false);

  useEffect(() => {
    if (hydrated && !usable) router.replace(`/${portal}/login`);
  }, [hydrated, usable, portal, router]);

  const enrollToken =
    usable && flow.stage === "mfa_enrollment_required" ? flow.step_token : null;
  useEffect(() => {
    if (!enrollToken || enrolled.current) return;
    enrolled.current = true;
    authApi
      .mfaEnroll(enrollToken)
      .then(setEnroll)
      .catch((err) => setError(errorMessage(err)));
  }, [enrollToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!flow) return;
    if (code.length !== CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits of the code.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const pair =
        flow.stage === "mfa_enrollment_required"
          ? await authApi.mfaEnrollConfirm(flow.step_token, code)
          : await authApi.mfaVerify(flow.step_token, code);
      startSession(pair, flow.remember !== false);
      let user = pair.user;
      if (flow.pending_name) {
        try {
          user = await usersApi.update(user.user_id, flow.pending_name);
          startSession({ ...pair, user }, flow.remember !== false);
        } catch {}
      }
      clearFlow();
      router.replace(landingFor(user, portal, next));
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
      setBusy(false);
    }
  }

  async function resend() {
    if (!flow) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      if (flow.stage === "mfa_enrollment_required") {
        setEnroll(await authApi.mfaEnroll(flow.step_token));
        setInfo("We sent a new code to your email.");
      } else if (flow.stage === "email_code_required") {
        const result = await authApi.resendEmailCode(flow.step_token);
        setInfo(result.detail);
      } else {
        const password = flowPasswordInMemory();
        if (!flow.email || !password) {
          router.replace(
            `/${portal}/login?email=${encodeURIComponent(flow.email ?? "")}`,
          );
          return;
        }
        const response = await authApi.login(flow.email, password);
        const updated = flowFromStage(portal, response, {
          email: flow.email,
          remember: flow.remember,
          pending_name: flow.pending_name,
        });
        saveFlow(updated);
        setFlow(updated);
        setInfo("We sent a new code to your email.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  if (!hydrated || !usable) return null;

  return (
    <form className="auth-center" onSubmit={handleSubmit} noValidate>
      <MailBadge />
      <h1 className="auth-title">Verify your email</h1>
      <p className="auth-lead">
        We&apos;ve sent a verification code to your email address.
      </p>

      <OtpInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (error) setError(null);
        }}
        invalid={Boolean(error)}
        disabled={busy}
        framed={portal === "parent"}
      />

      {enroll?.secret && (
        <details className="auth-secret">
          <summary>Using an authenticator app instead?</summary>
          Add Mirai to the app with this key, then type the code it shows:
          <code>{enroll.secret}</code>
        </details>
      )}

      {error && <Alert>{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      <div className="auth-actions auth-actions--verify">
        <Button type="submit" block loading={busy} className="auth-verify-btn">
          {busy ? "Checking…" : "Verify"}
        </Button>
        <Button
          variant="link"
          onClick={resend}
          loading={resending}
          className="auth-resend"
        >
          {resending ? "Sending…" : "Resend code"}
        </Button>
      </div>
      <Link href={`/${portal}/login`} className="auth-back-link">
        Use a different account
      </Link>
    </form>
  );
}
