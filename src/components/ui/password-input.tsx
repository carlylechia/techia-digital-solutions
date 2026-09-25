"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  name: string;
  /**
   * Visible label. When omitted the component renders no label of its own, so
   * it can sit inside an existing <label> wrapper such as the admin Field.
   */
  label?: string;
  autoComplete?: "current-password" | "new-password" | "off";
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Leading icon, absolutely positioned inside the field. */
  icon?: ReactNode;
  /** Extra classes for the input, for surfaces that do not use .form-input. */
  inputClassName?: string;
  /** Extra classes for the label wrapper. */
  labelClassName?: string;
  /** Translated toggle labels, so the control reads correctly in both languages. */
  toggleLabels?: { show: string; hide: string };
  className?: string;
};

/**
 * Password field with a visibility toggle. Anyone changing a password has to
 * confirm what they typed, and dots alone make a mistyped character invisible,
 * so the field can be revealed, checked, and masked again before submitting.
 *
 * The toggle is a non-submitting button, keeps the typed value, returns focus
 * to the field, and defaults to hidden so a password is never left on screen.
 */
export function PasswordInput({
  name,
  label,
  autoComplete = "current-password",
  minLength,
  maxLength,
  required,
  defaultValue,
  placeholder,
  disabled,
  icon,
  inputClassName,
  labelClassName,
  toggleLabels,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const showLabel = toggleLabels?.show || (label ? `Show ${label.toLowerCase()}` : "Show password");
  const hideLabel = toggleLabels?.hide || (label ? `Hide ${label.toLowerCase()}` : "Hide password");
  const actionLabel = visible ? hideLabel : showLabel;

  function toggle() {
    setVisible((current) => !current);
    inputRef.current?.focus();
  }

  const field = (
    <span className={cn("relative block", className)}>
      {icon}
      <input
        ref={inputRef}
        className={cn("form-input pr-11", icon && "pl-10", inputClassName)}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-labelledby={label ? labelId : undefined}
        required={required}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={actionLabel}
        aria-pressed={visible}
        title={actionLabel}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
      {label ? (
        <span className="sr-only">
          {visible ? `${label} is visible.` : `${label} is hidden.`}
        </span>
      ) : null}
    </span>
  );

  if (!label) return field;

  return (
    <label className={cn("form-label", labelClassName)}>
      <span id={labelId}>{label}</span>
      {field}
    </label>
  );
}
