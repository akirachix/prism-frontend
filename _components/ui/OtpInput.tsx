"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import "./ui.css";

/**
 * Six one-digit boxes. Typing moves to the next box, Backspace moves
 * back, and pasting a whole code fills every box at once.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  disabled,
  label = "Enter verification code",
  framed,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
  /** Mobile design: boxes sit inside a white card with the label below. */
  framed?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function focus(index: number) {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function handleInput(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigit(index, "");
      return;
    }
    if (clean.length > 1) {
      // Some keyboards (and autofill) put the whole code in one box.
      const merged = (digits.slice(0, index).join("") + clean).slice(0, length);
      onChange(merged);
      focus(merged.length);
      return;
    }
    setDigit(index, clean);
    focus(index + 1);
  }

  function handleKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigit(index - 1, "");
      focus(index - 1);
    } else if (event.key === "ArrowLeft") {
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      focus(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted.slice(0, length));
    focus(pasted.length);
  }

  return (
    <fieldset
      className={framed ? "ui-otp ui-otp--framed" : "ui-otp"}
      disabled={disabled}
    >
      <legend className="visually-hidden">{label}</legend>
      <div className="ui-otp__boxes">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            className={
              invalid ? "ui-otp__box ui-otp__box--invalid" : "ui-otp__box"
            }
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            maxLength={length}
            value={digit}
            aria-label={`Digit ${index + 1} of ${length}`}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKey(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>
      <p className="ui-otp__label" aria-hidden="true">
        {label}
      </p>
    </fieldset>
  );
}
