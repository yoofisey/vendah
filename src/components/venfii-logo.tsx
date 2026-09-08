export function VenfiiLogo({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
          onDark ? "bg-white/10" : "bg-pine"
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-gold" />
      </span>
      <span
        className={`font-heading text-xl font-semibold tracking-tight ${
          onDark ? "text-white" : "text-charcoal"
        }`}
      >
        venfii<span className="text-gold">.</span>
      </span>
    </span>
  );
}
