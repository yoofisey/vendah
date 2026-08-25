"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export const fieldInputBase =
  "w-full rounded-xl border bg-cream text-sm text-charcoal placeholder:text-muted transition duration-200 focus:bg-white focus:outline-none";

type FieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "onBlur"
> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  hint?: string;
  error?: string | null;
  valid?: boolean;
  validText?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
};

export function Field({
  label,
  icon,
  trailing,
  hint,
  error,
  valid,
  validText,
  onChange,
  onBlur,
  id,
  className = "",
  ...inputProps
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const border = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-200/70"
    : valid
      ? "border-emerald-400/70 focus:border-emerald-500 focus:ring-emerald-200/70"
      : "border-charcoal/15 focus:border-gold focus:ring-gold/30";

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-charcoal"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
          className={`${fieldInputBase} ${
            icon ? "pl-11" : "pl-4"
          } ${
            trailing ? "pr-12" : valid && !error ? "pr-10" : "pr-4"
          } py-3 ${border} ${className}`}
          {...inputProps}
        />
        {valid && !error && !trailing && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
        )}
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        )}
      </div>

      {error ? (
        <p
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          role="alert"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          {error}
        </p>
      ) : valid && validText ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {validText}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
