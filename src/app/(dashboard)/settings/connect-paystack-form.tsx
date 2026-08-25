"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { connectPaystack } from "./actions";
import { MOMO_CODES, type SettlementType } from "@/lib/settlement";

const inputClass =
  "mt-1 w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

const MOMO_LABELS: Record<string, string> = {
  MTN: "MTN Mobile Money",
  VOD: "Vodafone Cash",
  ATL: "AirtelTigo Money",
};

export function ConnectPaystackForm({
  banks,
  existingCode,
  salesFeePct,
  payoutVerified,
  payoutVerifiedName,
}: {
  banks: { code: string; name: string }[];
  existingCode: string | null;
  salesFeePct: number;
  payoutVerified: boolean;
  payoutVerifiedName: string | null;
}) {
  const [state, action, pending] = useActionState(connectPaystack, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<SettlementType>("momo");

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  const networks = banks.filter((b) =>
    (MOMO_CODES as readonly string[]).includes(b.code)
  );
  const bankAccounts = banks.filter(
    (b) => !(MOMO_CODES as readonly string[]).includes(b.code)
  );

  if (existingCode) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-green-800">
            Paystack connected
          </p>
          {payoutVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Verified ✓
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-green-700">
          Subaccount {existingCode}. Customer payments are settled to your bank
          account or mobile money wallet automatically.
        </p>
        {payoutVerified && payoutVerifiedName && (
          <p className="mt-1 text-xs text-green-700">
            Account holder: {payoutVerifiedName}
          </p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium">
          Business name
        </label>
        <input
          id="businessName"
          name="businessName"
          required
          placeholder="Your shop's legal business name"
          className={`${inputClass}`}
        />
      </div>
      <div>
        <span className="block text-sm font-medium">Settlement account</span>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-cream p-1">
          {(
            [
              { value: "momo", label: "Mobile Money" },
              { value: "bank", label: "Bank account" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              aria-pressed={type === opt.value}
              className={`rounded-md px-3 py-2 text-sm font-medium transition duration-200 ${
                type === opt.value
                  ? "bg-pine text-white shadow"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {type === "bank" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settlementBank"
              className="block text-sm font-medium"
            >
              Settlement bank
            </label>
            <select
              id="settlementBank"
              name="settlementBank"
              required
              defaultValue=""
              className={`${inputClass}`}
            >
              <option value="" disabled>
                Select bank…
              </option>
              {bankAccounts.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="accountNumber"
              className="block text-sm font-medium"
            >
              Account number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              required
              pattern="\d{10}"
              title="10-digit account number"
              placeholder="1234567890"
              className={`${inputClass}`}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settlementBank"
              className="block text-sm font-medium"
            >
              Mobile money network
            </label>
            <select
              id="settlementBank"
              name="settlementBank"
              required
              defaultValue=""
              className={`${inputClass}`}
            >
              <option value="" disabled>
                Select network…
              </option>
              {networks.map((n) => (
                <option key={n.code} value={n.code}>
                  {MOMO_LABELS[n.code] ?? n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="accountNumber"
              className="block text-sm font-medium"
            >
              Mobile money number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              required
              pattern="0\d{9}"
              title="10-digit phone number starting with 0"
              placeholder="0244123456"
              inputMode="tel"
              className={`${inputClass}`}
            />
          </div>
        </div>
      )}
      <p className="text-xs text-muted">
        Your platform commission ({salesFeePct}% on your current plan) is taken
        from each sale; the rest settles straight to this{" "}
        {type === "bank" ? "account" : "wallet"}.
      </p>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-200 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Connecting…" : "Connect Paystack"}
      </button>
    </form>
  );
}
