"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";

import styles from "./PasswordInput.module.css";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      {!open && (
        <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className = "", wrapperClassName = "", ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${styles.wrapper} ${wrapperClassName}`}>
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} ${styles.input}`}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={props.id}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
});

export default PasswordInput;
