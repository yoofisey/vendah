export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gray-900 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-gray-900">
        venfii
      </span>
    </span>
  );
}
