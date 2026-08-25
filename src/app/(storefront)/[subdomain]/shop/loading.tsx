export default function ShopLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-gold-light" />
        <div className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-white">
          …
        </div>
      </div>
      <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-white/75">
        Opening shop
      </p>
      <p className="mt-1 text-xs text-white/45">
        Loading the latest inventory…
      </p>
    </div>
  );
}
