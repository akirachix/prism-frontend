"use client";

import {
  useRef,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { OTP_LENGTH } from "@/lib/config";

interface Props {
  /** Number of boxes. Defaults to the authenticator code length (6). */
  length?: number;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * One box per digit. Typing moves forward, Backspace moves back, pasting a
 * whole code fills every box. With react-hook-form use it through <Controller>.
 */
export function CodeInput({
  length = OTP_LENGTH,
  value,
  onChange,
  label = "Verification code",
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) {
      // Deleted: drop this digit and shift the rest left.
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    // Digits are always filled left to right, so never leave a gap.
    const position = Math.min(i, value.length);
    onChange(
      (value.slice(0, position) + char + value.slice(position + 1)).slice(
        0,
        length,
      ),
    );
    refs.current[Math.min(position + 1, length - 1)]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div
      className="code"
      role="group"
      aria-label={label}
      style={{ "--code-length": length } as CSSProperties}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="code__digit"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
