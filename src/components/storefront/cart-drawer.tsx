"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cartTotalMinor, writeCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { startCheckoutTransition } from "@/components/checkout/checkout-transition";
import { useCart } from "@/components/cart/use-cart";
import type { CartItem } from "@/lib/cart";

type CartDrawerContextValue = {
  openCart: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function useOpenCart(): () => void {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error("useOpenCart must be used within a CartDrawerProvider");
  }
  return context.openCart;
}

export function CartDrawerProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openCart }), [openCart]);

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer tenantId={tenantId} open={open} onClose={closeCart} />
    </CartDrawerContext.Provider>
  );
}

export function CartDrawer({
  tenantId,
  open,
  onClose,
}: {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}) {
  const items = useCart(tenantId);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { subdomain } = useParams<{ subdomain?: string }>();
  const shopHref = resolveStorefrontHref(subdomain, "/shop");
  const checkoutHref = resolveStorefrontHref(subdomain, "/checkout");

  useEffect(() => {
    if (open) {
      setMounted(true);
      let innerFrame = 0;
      const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outerFrame);
        cancelAnimationFrame(innerFrame);
      };
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && mounted) closeButtonRef.current?.focus();
  }, [open, mounted]);

  function updateQuantity(productId: string, quantity: number) {
    const next = items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
      .filter((item) => item.quantity > 0);
    writeCart(tenantId, next);
  }

  function removeItem(productId: string) {
    writeCart(
      tenantId,
      items.filter((item) => item.productId !== productId)
    );
  }

  if (!mounted) return null;

  const subtotal = cartTotalMinor(items);
  const currency = items[0]?.currency;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <div
        className={`absolute inset-0 bg-charcoal/60 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
          <h2 className="flex items-center gap-2.5 font-heading text-lg font-semibold text-charcoal">
            Your cart
            {totalQuantity > 0 && (
              <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-xs font-bold text-pine">
                {totalQuantity}
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-charcoal-soft transition duration-150 hover:bg-cream hover:text-charcoal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
              <ShoppingBagIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm text-muted">Your cart is empty.</p>
            <Link
              href={shopHref}
              onClick={onClose}
              className="mt-5 rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-charcoal/5 overflow-y-auto px-5">
              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onNavigate={onClose}
                />
              ))}
            </ul>

            <div className="border-t border-charcoal/10 bg-cream px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-soft">Subtotal</span>
                <span className="font-heading text-xl font-semibold text-charcoal">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Delivery is calculated at checkout.
              </p>
              <Link
                href={checkoutHref}
                onClick={() => {
                  onClose();
                  startCheckoutTransition();
                }}
                className="mt-4 block rounded-lg bg-pine px-6 py-3 text-center text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
              >
                Checkout
              </Link>
              <Link
                href={shopHref}
                onClick={onClose}
                className="mt-2 block rounded-lg border border-charcoal/15 bg-white px-6 py-3 text-center text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
              >
                Continue shopping
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onNavigate: () => void;
}) {
  const { subdomain } = useParams<{ subdomain?: string }>();
  return (
    <li className="flex gap-4 py-4">
      {item.image ? (
        <Image
          src={item.image}
          alt={item.name}
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 rounded-xl border border-charcoal/10 object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-cream-soft text-base font-semibold text-muted">
          {item.name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={resolveStorefrontHref(subdomain, `/products/${item.slug}`)}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-medium leading-snug text-charcoal transition duration-150 hover:text-pine"
        >
          {item.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          {formatMoney(item.priceMinor, item.currency)} each
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/15 text-charcoal-soft transition duration-150 hover:bg-cream"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <span className="w-7 text-center text-sm font-medium text-charcoal">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.name}`}
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-charcoal/15 text-charcoal-soft transition duration-150 hover:bg-cream"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            className="ml-1 text-xs font-medium text-muted transition duration-150 hover:text-danger"
          >
            Remove
          </button>
        </div>
      </div>
      <p className="shrink-0 text-sm font-semibold text-charcoal">
        {formatMoney(item.priceMinor * item.quantity, item.currency)}
      </p>
    </li>
  );
}
