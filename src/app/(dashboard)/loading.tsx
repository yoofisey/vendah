export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-md bg-charcoal/10" />
          <div className="h-3.5 w-64 rounded-md bg-charcoal/10" />
        </div>
        <div className="h-6 w-20 rounded-full bg-charcoal/10" />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="h-28 rounded-xl border border-white/70 bg-white p-5 shadow-sm" />
        <div className="h-28 rounded-xl border border-white/70 bg-white p-5 shadow-sm" />
        <div className="h-28 rounded-xl border border-white/70 bg-white p-5 shadow-sm" />
      </div>

      <div className="space-y-4 rounded-xl border border-white/70 bg-white p-7 shadow-sm">
        <div className="h-5 w-40 rounded-md bg-charcoal/10" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-md bg-charcoal/10" />
          <div className="h-4 w-11/12 rounded-md bg-charcoal/10" />
          <div className="h-4 w-4/5 rounded-md bg-charcoal/10" />
          <div className="h-4 w-full rounded-md bg-charcoal/10" />
        </div>
      </div>
    </div>
  );
}