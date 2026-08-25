"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  submitCheckout,
  type CheckoutState,
} from "@/app/(storefront)/[subdomain]/checkout/actions";
import { cartTotalMinor } from "@/lib/cart";
import { useCart } from "@/components/cart/use-cart";
import { formatMoney } from "@/lib/format";

const initialState: CheckoutState = {};

const PAYMENT_METHODS = [
  { id: "mtn", name: "MTN Mobile Money" },
  { id: "vodafone", name: "Vodafone Cash" },
  { id: "airteltigo", name: "AirtelTigo Money" },
  { id: "card", name: "Card" },
];

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  isDefault: boolean;
};

function formatDeliveryAddress(address: SavedAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.region].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");
}

export function CheckoutForm({
  tenantId,
  deliveryFeeMinor,
  taxRates,
  shippingZones,
  savedAddresses = [],
}: {
  tenantId: string;
  deliveryFeeMinor: number;
  taxRates: Array<{ id: string; name: string; rate_pct: number; applies_to: string }>;
  shippingZones: Array<{ id: string; name: string; fee_minor: number; free_above_minor: number | null }>;
  savedAddresses?: SavedAddress[];
}) {
  const [state, action, pending] = useActionState(submitCheckout, initialState);
  const items = useCart(tenantId);
  const hasItems = items.length > 0;
  const [method, setMethod] = useState("mtn");
  const [collection, setCollection] = useState<"pickup" | "delivery">("delivery");
  const [discountInput, setDiscountInput] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState(
    shippingZones.length > 0 ? shippingZones[0].id : ""
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => savedAddresses.find((a) => a.isDefault)?.id ?? ""
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const notesEditedRef = useRef(false);
  const isMomo = method !== "card";

  useEffect(() => {
    if (state.redirectUrl) {
      window.location.assign(state.redirectUrl);
    }
  }, [state.redirectUrl]);

  useEffect(() => {
    if (!selectedAddressId) return;
    const address = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!address) return;
    setName(address.fullName);
    setPhone(address.phone);
    if (!notesEditedRef.current) {
      setNotes(formatDeliveryAddress(address));
    }
  }, [selectedAddressId, savedAddresses]);

  const cartJson = JSON.stringify(
    items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  );
  const subtotal = cartTotalMinor(items);

  const applicableTaxRate = taxRates.find((r) => r.applies_to === "all") ?? null;
  const taxMinor = applicableTaxRate
    ? Math.round((subtotal * applicableTaxRate.rate_pct) / 10000)
    : 0;

  const selectedZone =
    collection === "delivery"
      ? shippingZones.find((z) => z.id === selectedZoneId) ?? null
      : null;

  let deliveryFee = 0;
  if (collection === "delivery") {
    if (selectedZone) {
      const freeAbove = selectedZone.free_above_minor;
      deliveryFee =
        freeAbove !== null && subtotal >= freeAbove ? 0 : selectedZone.fee_minor;
    } else {
      deliveryFee = deliveryFeeMinor;
    }
  }

  const total = subtotal + deliveryFee + taxMinor;

  const currency = items[0]?.currency ?? "GHS";

  return (
    <form action={action} className="mt-8 space-y-6">
      <input type="hidden" name="tenantId" value={tenantId} />
      {hasItems && <input type="hidden" name="cart" value={cartJson} />}
      <input type="hidden" name="deliveryMethod" value={collection} />
      <input type="hidden" name="paymentMethod" value={method} />
      <input type="hidden" name="shippingZoneId" value={selectedZoneId} />

      <section className="space-y-5 rounded-xl border border-charcoal/10 bg-white p-7 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Your details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            name="name"
            placeholder="Ama Mensah"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="ama@example.com"
            required
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+233 24 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div>
            <label
              htmlFor="deliveryMethod"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Collection method
            </label>
            <select
              id="deliveryMethod"
              value={collection}
              onChange={(e) =>
                setCollection(e.target.value as "pickup" | "delivery")
              }
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>
        {collection === "delivery" && shippingZones.length > 0 && (
          <div>
            <label
              htmlFor="shippingZone"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Shipping zone
            </label>
            <select
              id="shippingZone"
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              {shippingZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {collection === "delivery" && savedAddresses.length > 0 && (
          <div>
            <label
              htmlFor="savedAddress"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Saved addresses
            </label>
            <select
              id="savedAddress"
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">Enter a new address</option>
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.fullName}, {a.addressLine1}, {a.city}
                  {a.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
            <Link
              href="/addresses"
              className="mt-1.5 inline-block text-xs font-medium text-pine underline-offset-2 hover:underline"
            >
              Manage addresses
            </Link>
          </div>
        )}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-charcoal-soft"
          >
            {collection === "pickup" ? "Pickup notes" : "Notes or delivery address"}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => {
              notesEditedRef.current = true;
              setNotes(e.target.value);
            }}
            placeholder={
              collection === "pickup"
                ? "Preferred pickup time or anything we should know."
                : "Address, landmark, or any instructions for the shop."
            }
            className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-charcoal/10 bg-white p-7 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Payment method
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition duration-150 ${
                  selected
                    ? "border-brand-accent bg-brand-accent/5 text-charcoal"
                    : "border-charcoal/15 bg-cream text-charcoal-soft hover:border-charcoal/30"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
        {isMomo && (
          <div>
            <label
              htmlFor="momoPhone"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Mobile money number
            </label>
            <input
              id="momoPhone"
              name="momoPhone"
              required
              inputMode="tel"
              autoComplete="tel-national"
              pattern="0\d{9}"
              title="10-digit phone number starting with 0, e.g. 0244123456"
              placeholder="0244123456"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <p className="mt-1 text-xs text-muted">
              We&apos;ll send the payment prompt to this number — approve it on
              your phone.
            </p>
          </div>
        )}
      </section>

      {hasItems ? (
        <>
          <section className="rounded-xl border border-charcoal/10 bg-white p-7 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              Order summary
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4">
                  <span className="text-charcoal-soft">
                    {item.name}{" "}
                    <span className="text-muted">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-charcoal">
                    {formatMoney(item.priceMinor * item.quantity, item.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-charcoal">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">
                  {collection === "delivery"
                    ? selectedZone
                      ? `Shipping (${selectedZone.name})`
                      : "Delivery fee"
                    : "Pickup"}
                </span>
                <span className="font-medium text-charcoal">
                  {collection === "delivery"
                    ? deliveryFee === 0
                      ? "Free"
                      : formatMoney(deliveryFee, currency)
                    : "Free"}
                </span>
              </div>
              {applicableTaxRate && taxMinor > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">
                    Tax ({applicableTaxRate.name})
                  </span>
                  <span className="font-medium text-charcoal">
                    {formatMoney(taxMinor, currency)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <input
                  name="discountCode"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  className="flex-1 rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex items-center justify-between border-t border-charcoal/10 pt-2">
                <span className="text-sm text-muted">Total</span>
                <span className="text-xl font-bold text-pine">
                  {formatMoney(total, currency)}
                </span>
              </div>
            </div>
          </section>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-accent px-6 py-3.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Starting payment…" : `Pay ${formatMoney(total)}`}
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-charcoal/10 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-muted">
            Your cart is empty — add something before checking out.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-lg bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Back to shop
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        Payments are processed securely by Paystack.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-charcoal-soft"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </div>
  );
}
