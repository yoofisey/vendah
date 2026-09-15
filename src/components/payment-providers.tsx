export function PaymentProviders() {
  return (
    <section className="border-y border-charcoal/5 bg-white px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
          Built for Ghanaian checkout
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Paystack-powered card and mobile money — accept the ways your
          customers already pay.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Badge
            mark={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-charcoal text-xs font-bold text-white">
                P
              </span>
            }
            label="Paystack"
          />
          <Badge
            mark={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-400 text-[9px] font-bold text-charcoal">
                MTN
              </span>
            }
            label="MTN MoMo"
          />
          <Badge
            mark={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500 text-xs font-bold text-white">
                V
              </span>
            }
            label="Vodafone Cash"
          />
          <Badge
            mark={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-[8px] font-bold text-white">
                AT
              </span>
            }
            label="AirtelTigo Money"
          />
          <Badge
            mark={<span className="text-sm font-bold italic text-[#1a1f71]">VISA</span>}
            label="Card"
          />
          <Badge
            mark={
              <span className="flex -space-x-1.5">
                <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
                <span className="h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
              </span>
            }
            label="Mastercard"
          />
        </div>
        <p className="mt-6 text-xs text-muted">
          Every transaction is processed securely by Paystack.
        </p>
      </div>
    </section>
  );
}

function Badge({ mark, label }: { mark: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-charcoal/10 bg-cream/60 px-4 py-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-charcoal/20 hover:bg-white">
      {mark}
      <span className="text-sm font-semibold text-charcoal">{label}</span>
    </span>
  );
}