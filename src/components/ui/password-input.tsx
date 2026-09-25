"use client";

import { useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password field with a visibility toggle. Writers cannot verify a mistyped
 * password from dots alone, so they can reveal what they typed, confirm it, and
 * hide it again before submitting. The toggle never submits the form and
 * returns focus to the field so typing can continue immediately.
 */
export function PasswordInput({
  name,
  label,
  autoComplete,
  minLength,
  required = true,
  defaultValue,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const showLabel = `Show ${label.toLowerCase()}`;
  const hideLabel = `Hide ${label.toLowerCase()}`;

  function toggle() {
    setVisible((current) => !current);
    inputRef.current?.focus();
  }

  return (
    <span className="grid gap-2">
      <span className="form-label" id={labelId}>
        {label}
      </span>
      <span className="relative block">
        <input
          ref={inputRef}
          className="form-input pr-11"
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          defaultValue={defaultValue}
          aria-labelledby={labelId}
          aria-describedby={`${labelId}-hint`}
          required={required}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={`${labelId}-hint`}
          title={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
        <span className="sr-only" id={`${labelId}-hint`}>
          {visible ? `${label} is visible.` : `${label} is hidden.`}
        </span>
      </span>
    </span>
  );
}
