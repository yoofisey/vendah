"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bars3Icon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCartCount } from "@/components/cart/use-cart";
import { useOpenCart } from "@/components/storefront/cart-drawer";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import type { Tenant } from "@/lib/types";

export function StorefrontHeader({
  tenant,
  tagline,
}: {
  tenant: Tenant;
  tagline?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const logoUrl = tenant.branding?.logoUrl;
  const subdomain = tenant.subdomain;
  const searchHref = resolveStorefrontHref(
    subdomain,
    `/${tenant.subdomain}/search`
  );
  const cartCount = useCartCount(tenant.id);
  const openCart = useOpenCart();
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand text-white shadow-md">
      <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="storefront-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-1.5 text-white/80 transition duration-150 hover:bg-white/10 hover:text-white lg:hidden"
          >
            {menuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <Link href={resolveStorefrontHref(subdomain, "/")} className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${tenant.name} logo`}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {tenant.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="block truncate font-heading text-lg font-semibold leading-tight sm:text-xl">
                  {tenant.name}
                </span>
                {tenant.payout_verified && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                    Verified ✓
                  </span>
                )}
              </span>
              <span className="hidden truncate text-[11px] text-white/65 sm:block">
                {tagline ?? "Your favourite finds, delivered with care"}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <Link
            href={searchHref}
            aria-label="Search products"
            className="hidden rounded-full p-2 text-white/80 transition duration-150 hover:bg-white/10 hover:text-white lg:block"
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Link>

          <Link
            href={resolveStorefrontHref(subdomain, "/shop")}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition duration-150 hover:bg-white/10 hover:text-white lg:block"
          >
            Shop
          </Link>

          <Link
            href={resolveStorefrontHref(subdomain, "/account")}
            aria-label="My account"
            className="hidden rounded-full p-2 text-white/80 transition duration-150 hover:bg-white/10 hover:text-white sm:block"
          >
            <UserIcon className="h-6 w-6" />
          </Link>

          <Link
            href={resolveStorefrontHref(subdomain, "/addresses")}
            aria-label="My addresses"
            className="hidden rounded-full p-2 text-white/80 transition duration-150 hover:bg-white/10 hover:text-white sm:block"
          >
            <MapPinIcon className="h-6 w-6" />
          </Link>

          <Link
            href={resolveStorefrontHref(subdomain, "/wishlist")}
            aria-label="My wishlist"
            className="hidden rounded-full p-2 text-white/80 transition duration-150 hover:bg-white/10 hover:text-white sm:block"
          >
            <HeartIcon className="h-6 w-6" />
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/25 sm:ml-0"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-charcoal">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        id="storefront-mobile-menu"
        aria-hidden={!menuOpen}
        className={`grid transition-all duration-300 ease-out lg:hidden ${
          menuOpen
            ? "visible grid-rows-[1fr] opacity-100"
            : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            onClick={closeMenu}
            className="border-t border-white/10 bg-brand px-4 py-4"
          >
            <Link
              href={searchHref}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search products
            </Link>
            <nav className="mt-4 grid grid-cols-2 gap-1.5 text-sm text-white/85">
              <Link href={resolveStorefrontHref(subdomain, "/shop")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                Shop all products
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/account")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                My account
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/addresses")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                My addresses
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/wishlist")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                My wishlist
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/track")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                Track my order
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/delivery")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                Delivery &amp; returns
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/about")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                About
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/contact")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                Contact
              </Link>
              <Link href={resolveStorefrontHref(subdomain, "/faq")} className="rounded-lg px-3 py-2.5 transition duration-150 hover:bg-white/10">
                FAQs
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
