"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

import "./ui.css";

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
}

/** Label, input and error message, wired together for screen readers. */
export function TextField({
  label,
  error,
  hint,
  optional,
  id,
  className,
  ...input
}: FieldProps & ComponentProps<"input">) {
  const fallback = useId();
  const inputId = id ?? fallback;
  const errorId = `${inputId}-error`;
  return (
    <div className={`ui-field ${className ?? ""}`}>
      <label className="ui-field__label" htmlFor={inputId}>
        {label}
        {optional && <span className="ui-field__optional"> (optional)</span>}
      </label>
      <input
        id={inputId}
        className="ui-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      {hint && !error && <p className="ui-field__hint">{hint}</p>}
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label,
  error,
  hint,
  id,
  className,
  ...input
}: FieldProps & Omit<ComponentProps<"input">, "type">) {
  const fallback = useId();
  const inputId = id ?? fallback;
  const errorId = `${inputId}-error`;
  const [visible, setVisible] = useState(false);
  const Icon = visible ? Eye : EyeOff;
  return (
    <div className={`ui-field ${className ?? ""}`}>
      <label className="ui-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ui-input-wrap">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className="ui-input ui-input--with-icon"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...input}
        />
        <button
          type="button"
          className="ui-input-icon"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <Icon size={22} aria-hidden="true" />
        </button>
      </div>
      {hint && !error && <p className="ui-field__hint">{hint}</p>}
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  error,
  optional,
  id,
  className,
  children,
  ...select
}: FieldProps & ComponentProps<"select">) {
  const fallback = useId();
  const selectId = id ?? fallback;
  const errorId = `${selectId}-error`;
  return (
    <div className={`ui-field ${className ?? ""}`}>
      <label className="ui-field__label" htmlFor={selectId}>
        {label}
        {optional && <span className="ui-field__optional"> (optional)</span>}
      </label>
      <select
        id={selectId}
        className="ui-input ui-select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...select}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  optional,
  id,
  className,
  ...area
}: FieldProps & ComponentProps<"textarea">) {
  const fallback = useId();
  const areaId = id ?? fallback;
  const errorId = `${areaId}-error`;
  return (
    <div className={`ui-field ${className ?? ""}`}>
      <label className="ui-field__label" htmlFor={areaId}>
        {label}
        {optional && <span className="ui-field__optional"> (optional)</span>}
      </label>
      <textarea
        id={areaId}
        className="ui-input ui-textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...area}
      />
      {error && (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
