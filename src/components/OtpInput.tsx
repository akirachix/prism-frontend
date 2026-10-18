"use client";

import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";

import styles from "./OtpInput.module.css";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  digitClassName?: string;
}

export default function OtpInput({
  length = 5,
  value,
  onChange,
  invalid = false,
  disabled = false,
  labelledBy,
  describedBy,
  className = "",
  digitClassName = "",
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const focus = (index: number) => {
    const target = inputs.current[Math.max(0, Math.min(length - 1, index))];
    if (target) {
      target.focus();
      target.select();
    }
  };

  function fillFrom(start: number, text: string) {
    const clean = text.replace(/\D/g, "");
    if (!clean) return;
    const next = digits.slice();
    for (let i = 0; i < clean.length && start + i < length; i += 1) {
      next[start + i] = clean[i];
    }
    onChange(next.join("").slice(0, length));
    focus(start + clean.length);
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const typed = event.target.value.replace(/\D/g, "");
    if (typed.length > 1) {
      fillFrom(index, typed);
      return;
    }
    const next = digits.slice();
    next[index] = typed;
    onChange(next.join(""));
    if (typed) focus(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = digits.slice();
      next[index - 1] = "";
      onChange(next.join(""));
      focus(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`${styles.group} ${className}`}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? "true" : "false"}
          disabled={disabled}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={`${styles.digit} ${digitClassName}`}
        />
      ))}
    </div>
  );
}
