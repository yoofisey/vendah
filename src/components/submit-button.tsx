"use client";

export function SubmitButton({
  pending,
  children,
  className = "",
}: {
  pending?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full select-none rounded-lg bg-pine py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-pine/50 disabled:active:scale-100 ${className}`}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
