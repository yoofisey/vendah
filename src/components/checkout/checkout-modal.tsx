"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { submitCheckout, type CheckoutState } from "@/app/(storefront)/[subdomain]/checkout/actions";
import { cartTotalMinor, writeCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/cart/use-cart";

const initialState: CheckoutState = {};

const STEPS = ["Cart Review", "Delivery Details", "Payment"];

const PAYMENT_METHODS = [
  {
    id: "mtn",
    name: "MTN Mobile Money",
    tag: "MTN",
    className: "bg-yellow-400 text-charcoal",
    note: "Approve the payment on your phone",
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
  },
  {
    id: "vodafone",
    name: "Vodafone Cash",
    tag: "Vodafone",
    className: "bg-red-500 text-white",
    note: "Approve the payment on your phone",
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
  },
  {
    id: "airteltigo",
    name: "AirtelTigo Money",
    tag: "AirtelTigo",
    className: "bg-blue-600 text-white",
    note: "Approve the payment on your phone",
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
  },
  {
    id: "card",
    name: "Card",
    tag: "Card",
    className: "bg-charcoal text-white",
    note: "Visa, Mastercard, Verve",
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    tag: "COD",
    className: "bg-emerald-600 text-white",
    note: "Pay in cash when your order arrives",
    icon: <BanknotesIcon className="h-5 w-5" />,
  },
];

const inputClass =
  "w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function CheckoutModal({
  tenantId,
  deliveryFeeMinor,
  onClose,
}: {
  tenantId: string;
  deliveryFeeMinor: number;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(submitCheckout, initialState);
  const items = useCart(tenantId);
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("mtn");
  const [collection, setCollection] = useState<"pickup" | "delivery">("delivery");
  const [localError, setLocalError] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const subtotal = cartTotalMinor(items);
  const deliveryFee = collection === "delivery" ? deliveryFeeMinor : 0;
  const total = subtotal + deliveryFee;
  const isMomo =
    method === "mtn" || method === "vodafone" || method === "airteltigo";
  const isCod = method === "cod";
  const cartJson = JSON.stringify(
    items.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity }))
  );

  useEffect(() => {
    if (state.redirectUrl) {
      window.location.assign(state.redirectUrl);
    }
  }, [state.redirectUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function updateQuantity(productId: string, quantity: number) {
    const next = items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    );
    writeCart(tenantId, next.filter((item) => item.quantity > 0));
  }

  function remove(productId: string) {
    writeCart(
      tenantId,
      items.filter((item) => item.productId !== productId)
    );
  }

  function goNext() {
    setLocalError(null);
    if (step === 0 && !hasItems) {
      setLocalError("Your cart is empty.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-charcoal">
            Checkout
          </h2>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="rounded-lg p-1.5 text-muted transition duration-150 hover:bg-cream hover:text-charcoal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-charcoal/10 px-6 py-3">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition duration-200 ${
                      i < step
                        ? "bg-pine text-white"
                        : i === step
                          ? "bg-gold text-charcoal"
                          : "border border-charcoal/20 text-muted"
                  }`}
                >
                  {i < step ? <CheckCircleIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    i === step
                      ? "text-charcoal"
                      : i < step
                        ? "text-pine"
                        : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={`h-0.5 flex-1 rounded-full ${
                      i < step ? "bg-gold" : "bg-charcoal/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form
          action={action}
          className="flex-1 overflow-y-auto"
          noValidate
          onSubmit={() => setLocalError(null)}
        >
          <input type="hidden" name="tenantId" value={tenantId} />
          {hasItems && <input type="hidden" name="cart" value={cartJson} />}
          <input type="hidden" name="deliveryMethod" value={collection} />
          <input type="hidden" name="paymentMethod" value={method} />

          <div className="px-6 py-6">
            {step === 0 && (
              <div>
                {!hasItems ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted">
                      Your cart is empty.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-charcoal/5">
                    {items.map((item) => (
                      <li key={item.productId} className="flex items-center gap-4 py-4">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded-lg border border-charcoal/10 object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-sm font-semibold text-muted">
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-charcoal">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted">
                            {formatMoney(item.priceMinor, item.currency)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="h-7 w-7 rounded-md border border-charcoal/15 text-sm text-charcoal-soft transition hover:bg-cream"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="h-7 w-7 rounded-md border border-charcoal/15 text-sm text-charcoal-soft transition hover:bg-cream"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          className="text-xs font-medium text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-medium text-charcoal">
                    Full name
                  </label>
                  <input
                    id="modal-name"
                    name="name"
                    required
                    placeholder="Ama Mensah"
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="modal-email" className="block text-sm font-medium text-charcoal">
                      Email
                    </label>
                    <input
                      id="modal-email"
                      name="email"
                      type="email"
                      required
                      placeholder="ama@example.com"
                      className={`mt-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-phone" className="block text-sm font-medium text-charcoal">
                      Phone
                    </label>
                    <input
                      id="modal-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+233 24 000 0000"
                      className={`mt-1 ${inputClass}`}
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-charcoal">
                    Collection method
                  </span>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    {(["pickup", "delivery"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setCollection(option)}
                        className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium capitalize transition duration-200 ${
                          collection === option
                            ? "border-gold bg-gold/[0.06] text-charcoal"
                            : "border-charcoal/15 bg-cream text-charcoal-soft hover:border-charcoal/25"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="modal-notes" className="block text-sm font-medium text-charcoal">
                    {collection === "pickup" ? "Pickup notes" : "Delivery address / notes"}
                  </label>
                  <textarea
                    id="modal-notes"
                    name="notes"
                    rows={3}
                    placeholder={
                      collection === "pickup"
                        ? "Preferred pickup time or anything we should know."
                        : "Address, landmark, or any instructions for the shop."
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-base font-semibold text-charcoal">Choose payment</p>
                <div className="mt-4 space-y-3">
                  {PAYMENT_METHODS.map((m) => {
                    const selected = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition duration-200 ${
                          selected
                            ? "border-gold bg-gold/[0.06] shadow-md"
                            : "border-charcoal/10 bg-cream hover:border-charcoal/25"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.className}`}
                        >
                          {m.icon}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-charcoal">
                            {m.name}
                          </span>
                          <span className="block text-xs text-muted">
                            {m.note}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition duration-150 ${
                            selected ? "border-gold bg-gold" : "border-charcoal/25"
                          }`}
                        >
                          {selected && <CheckCircleIcon className="h-3.5 w-3.5 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isMomo && (
                  <div className="mt-4">
                    <label
                      htmlFor="modal-momo-phone"
                      className="block text-sm font-medium text-charcoal"
                    >
                      Mobile money number
                    </label>
                    <input
                      id="modal-momo-phone"
                      name="momoPhone"
                      required
                      inputMode="tel"
                      autoComplete="tel-national"
                      pattern="0\d{9}"
                      title="10-digit phone number starting with 0, e.g. 0244123456"
                      placeholder="0244123456"
                      className={`mt-1 ${inputClass}`}
                    />
                    <p className="mt-1 text-xs text-muted">
                      We&apos;ll send the payment prompt to this number — approve
                      it on your phone.
                    </p>
                  </div>
                )}
              </div>
            )}

            {(state.error || localError) && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {state.error ?? localError}
              </p>
            )}
          </div>

          <div className="border-t border-charcoal/10 px-6 py-5">
            <div className="mb-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-charcoal">
                  {formatMoney(subtotal, items[0]?.currency ?? "GHS")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">
                  {collection === "delivery" ? "Delivery fee" : "Pickup"}
                </span>
                <span className="font-medium text-charcoal">
                  {collection === "delivery"
                    ? formatMoney(deliveryFee, items[0]?.currency ?? "GHS")
                    : "Free"}
                </span>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="font-heading text-2xl font-semibold text-charcoal">
                {formatMoney(total, items[0]?.currency ?? "GHS")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setStep((s) => s - 1);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
                >
                  <ArrowLeftIcon className="h-4 w-4" /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
                >
                  Keep shopping
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={pending || !hasItems}
                  className="flex-1 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending
                    ? isCod
                      ? "Placing order…"
                      : "Starting payment…"
                    : isCod
                      ? "Place order — pay on delivery"
                      : `Pay ${formatMoney(total)} with ${
                          PAYMENT_METHODS.find((m) => m.id === method)?.name ??
                          "card"
                        }`}                </button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              {isCod
                ? "No online payment needed — pay in cash when your order arrives."
                : "Payments are processed securely by Paystack."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
