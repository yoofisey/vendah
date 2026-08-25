"use client";

import { useState } from "react";
import {
  BanknotesIcon,
  DevicePhoneMobileIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { formatMoney } from "@/lib/format";

type PayoutRow = {
  id: string;
  created_at: string;
  amount_minor: number;
  currency: string;
};

export function PayoutCard({
  balanceMinor,
  momoNumber,
  history,
}: {
  balanceMinor: number;
  momoNumber: string;
  history: PayoutRow[];
}) {
  const [requested, setRequested] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <h2 className="relative flex items-center gap-2 font-heading text-lg font-semibold text-charcoal">
        <BanknotesIcon className="h-5 w-5 text-pine" /> Payouts
      </h2>

      <div className="relative mt-5 overflow-hidden rounded-lg bg-[linear-gradient(150deg,#1b4332_0%,#163a2b_52%,#0f2c20_100%)] p-5 text-white shadow-[0_18px_40px_-18px_rgba(27,67,50,0.6)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-3xl"
        />
        <p className="relative text-sm text-white/70">Available balance</p>
        <p className="relative mt-1 font-heading text-3xl font-semibold">
          {formatMoney(balanceMinor, "GHS")}
        </p>
        <div className="relative mt-3 flex items-center gap-2 text-sm text-white/80">
          <DevicePhoneMobileIcon className="h-4 w-4" />
          <span>Linked MoMo · {momoNumber}</span>
        </div>
        <button
          type="button"
          onClick={() => setRequested(true)}
          className="relative mt-4 flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gold/25 transition duration-200 hover:-translate-y-px hover:bg-gold-dark"
        >
          <BanknotesIcon className="h-4 w-4" />
          Request Payout
        </button>
        {requested && (
          <p className="relative mt-3 flex items-start gap-1.5 text-xs text-white/80">
            <CheckBadgeIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
            Payout requested. Funds reach your MoMo number within 1–2 business
            days.
          </p>
        )}
      </div>

      <div className="relative mt-5">
        <h3 className="text-sm font-semibold text-charcoal">Recent collections</h3>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No collections yet. Customer payments will show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-charcoal/5">
            {history.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    {formatMoney(row.amount_minor, row.currency)}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Awaiting payout
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
