"use client";

import { useId, useState, type InputHTMLAttributes, type Ref } from "react";
import { EyeIcon, EyeOffIcon } from "../icons";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Message shown under the field (e.g. react-hook-form's errors.email?.message). */
  error?: string;
  /** Adds the show / hide button and hides the text. */
  password?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Works with react-hook-form: `<TextField label="Email" {...register("email")} />`
 * (register() returns name / onChange / onBlur / ref, all passed to the <input>).
 */
export function TextField({ label, error, password, type, ref, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const inputType = password ? (visible ? "text" : "password") : (type ?? "text");

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className={`field__control ${error ? "field__control--error" : ""}`}>
        <input
          id={inputId}
          ref={ref}
          className="field__input"
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {password && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="field__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
