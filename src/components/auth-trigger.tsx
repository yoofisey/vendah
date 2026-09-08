"use client";

export type AuthMode = "signin" | "signup";

export const AUTH_OPEN_EVENT = "venfii:open-auth";
export const AUTH_SWITCH_EVENT = "venfii:switch-auth";

export function openAuthSheet(mode: AuthMode) {
  window.dispatchEvent(
    new CustomEvent(AUTH_OPEN_EVENT, { detail: mode })
  );
}

export function AuthTrigger({
  mode,
  className = "",
  children,
  "aria-label": ariaLabel,
}: {
  mode: AuthMode;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => openAuthSheet(mode)}
      className={className}
    >
      {children}
    </button>
  );
}
