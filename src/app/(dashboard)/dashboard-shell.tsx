"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  BanknotesIcon,
  Bars3Icon,
  BellIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CubeIcon,
  EnvelopeIcon,
  GiftIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  Square3Stack3DIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { logOut } from "@/app/(auth)/actions";
import { VenfiiLogo } from "@/components/venfii-logo";
import { getStorefrontUrl } from "@/lib/tenant";
import { isFeatureEnabled, type FeatureKey } from "@/lib/plan-gating";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Squares2X2Icon;
  requiredFeature?: FeatureKey;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Squares2X2Icon },
  { href: "/analytics", label: "Analytics", icon: ChartBarIcon },
  { href: "/orders", label: "Orders", icon: ShoppingBagIcon },
  { href: "/products", label: "Products", icon: CubeIcon },
  { href: "/customers", label: "Customers", icon: UsersIcon },
  { href: "/discounts", label: "Discounts", icon: TagIcon },
  { href: "/gift-cards", label: "Gift Cards", icon: GiftIcon },
  { href: "/cart-recovery", label: "Cart Recovery", icon: ArrowPathIcon, requiredFeature: "cart-recovery" },
  { href: "/marketing", label: "Marketing", icon: EnvelopeIcon, requiredFeature: "email-campaigns" },
  { href: "/shipping", label: "Shipping", icon: TruckIcon },
  { href: "/returns", label: "Returns", icon: ArrowUturnLeftIcon },
  { href: "/homepage", label: "Homepage", icon: Square3Stack3DIcon },
  { href: "/payments", label: "Payments", icon: BanknotesIcon },
  { href: "/tax", label: "Tax", icon: CalculatorIcon },
  { href: "/staff", label: "Staff", icon: UserGroupIcon, requiredFeature: "staff" },
  { href: "/settings", label: "Store Settings", icon: Cog6ToothIcon },
];

const TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/dashboard$/, title: "Overview" },
  { match: /^\/analytics$/, title: "Analytics" },
  { match: /^\/orders\/.+/, title: "Order details" },
  { match: /^\/orders$/, title: "Orders" },
  { match: /^\/products\/new$/, title: "New product" },
  { match: /^\/products\/.+/, title: "Product details" },
  { match: /^\/products$/, title: "Products" },
  { match: /^\/customers$/, title: "Customers" },
  { match: /^\/discounts$/, title: "Discount Codes" },
  { match: /^\/gift-cards$/, title: "Gift Cards" },
  { match: /^\/cart-recovery$/, title: "Cart Recovery" },
  { match: /^\/marketing$/, title: "Email Marketing" },
  { match: /^\/shipping$/, title: "Shipping Zones" },
  { match: /^\/returns$/, title: "Returns & Refunds" },
  { match: /^\/homepage$/, title: "Homepage Sections" },
  { match: /^\/payments$/, title: "Payments" },
  { match: /^\/tax$/, title: "Tax Rates" },
  { match: /^\/staff$/, title: "Staff Accounts" },
  { match: /^\/settings$/, title: "Store Settings" },
  { match: /^\/help$/, title: "Help & FAQ" },
];

export function DashboardChrome({
  tenantName,
  tenantSubdomain,
  tenantTier,
  userEmail,
  pendingOrderCount = 0,
  children,
}: {
  tenantName: string;
  tenantSubdomain: string;
  tenantTier: string;
  userEmail: string;
  pendingOrderCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const title =
    TITLES.find((t) => t.match.test(pathname))?.title ?? "Dashboard";
  const active = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-cream bg-[radial-gradient(56rem_38rem_at_105%_-8%,rgba(212,160,23,0.12),transparent_60%),radial-gradient(48rem_36rem_at_-8%_108%,rgba(27,67,50,0.1),transparent_55%)]">
      {/* Desktop + tablet sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden w-20 flex-col overflow-hidden bg-[linear-gradient(165deg,#1b4332_0%,#163a2b_48%,#0f2c20_100%)] text-white transition-[width] duration-300 md:flex ${
          collapsed ? "lg:w-20 lg:hover:w-64" : "lg:w-64"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-gold/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-pine-light/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_14px]"
        />
        <div className="relative flex h-20 items-center justify-center gap-2 border-b border-white/10 px-3 lg:justify-start lg:px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
            </span>
            <span className={`min-w-0 ${collapsed ? "hidden lg:hover:block" : "hidden lg:block"}`}>
              <span className="block font-heading text-lg font-semibold leading-none tracking-tight">
                venfii<span className="text-gold">.</span>
              </span>
              <span className="mt-1 block max-w-40 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
                {tenantName}
              </span>
            </span>
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto hidden rounded-lg p-1.5 text-white/50 transition duration-200 hover:bg-white/10 hover:text-white lg:block"
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4" />
            ) : (
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="relative mt-3 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const isActive = active(item.href);
            const locked =
              item.requiredFeature &&
              !isFeatureEnabled(tenantTier, item.requiredFeature);
            return (
              <Link
                key={item.href}
                href={locked ? "#!" : item.href}
                title={item.label}
                onClick={locked ? (e) => e.preventDefault() : undefined}
                className={`group relative flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
                  collapsed ? "lg:hover:justify-start" : "lg:justify-start"
                } ${
                  locked
                    ? "cursor-not-allowed text-white/30 opacity-60"
                    : isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`absolute inset-y-1.5 left-0 w-1 rounded-r-full transition ${
                    isActive && !locked ? "bg-gold" : "bg-transparent"
                  }`}
                />
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={collapsed ? "hidden lg:hover:block" : "hidden lg:block"}>{item.label}</span>
                {locked && (
                  <span
                    className={
                      collapsed
                        ? "hidden lg:hover:inline-flex items-center rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold"
                        : "hidden lg:inline-flex items-center rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold"
                    }
                  >
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href={getStorefrontUrl(tenantSubdomain)}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center gap-3 rounded-lg bg-gold/20 px-3 py-2.5 text-sm font-semibold text-gold transition duration-200 hover:bg-gold/30 ${
              collapsed ? "lg:hover:justify-start" : "lg:justify-start"
            }`}
            title="View your store"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "hidden lg:hover:block" : "hidden lg:block"}>View Store</span>
          </a>
          <Link
            href="/help"
            className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition duration-200 hover:bg-white/5 hover:text-white ${
              collapsed ? "lg:hover:justify-start" : "lg:justify-start"
            }`}
            title="Help & FAQ"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "hidden lg:hover:block" : "hidden lg:block"}>Help &amp; FAQ</span>
          </Link>
          <a
            href="mailto:support@venfii.com?subject=Help%20with%20my%20shop"
            className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition duration-200 hover:bg-white/5 hover:text-white ${
              collapsed ? "lg:hover:justify-start" : "lg:justify-start"
            }`}
            title="Help & Support"
          >
            <LifebuoyIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "hidden lg:hover:block" : "hidden lg:block"}>Help & Support</span>
          </a>
          <form action={logOut}>
            <button
              type="submit"
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition duration-200 hover:bg-white/5 hover:text-white ${
                collapsed ? "lg:hover:justify-start" : "lg:justify-start"
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <span className={collapsed ? "hidden lg:hover:block" : "hidden lg:block"}>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-hidden bg-[linear-gradient(165deg,#1b4332_0%,#163a2b_48%,#0f2c20_100%)] text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-pine-light/50 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_14px]"
            />
            <div className="relative flex h-16 items-center justify-between px-5">
              <VenfiiLogo onDark />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-white/70 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="relative mt-3 flex-1 space-y-1 px-3">
              {NAV.map((item) => {
                const isActive = active(item.href);
                const locked =
                  item.requiredFeature &&
                  !isFeatureEnabled(tenantTier, item.requiredFeature);
                return (
                  <Link
                    key={item.href}
                    href={locked ? "#!" : item.href}
                    onClick={locked ? (e) => { e.preventDefault(); setDrawerOpen(false); } : () => setDrawerOpen(false)}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
                      locked
                        ? "cursor-not-allowed text-white/30 opacity-60"
                        : isActive
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-1.5 left-0 w-1 rounded-r-full ${
                        isActive && !locked ? "bg-gold" : "bg-transparent"
                      }`}
                    />
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                    {locked && (
                      <span className="inline-flex items-center rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                        Pro
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
        <div className="relative space-y-1 border-t border-white/10 p-3">
              <a
                href={getStorefrontUrl(tenantSubdomain)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg bg-gold/20 px-3 py-2.5 text-sm font-semibold text-gold hover:bg-gold/30"
                title="View your store"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" /> View Store
              </a>
              <Link
                href="/help"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" /> Help &amp; FAQ
              </Link>
              <a
                href="mailto:support@venfii.com?subject=Help%20with%20my%20shop"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
              >
                <LifebuoyIcon className="h-5 w-5" /> Help & Support
              </a>
              <form action={logOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Log out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className={`md:pl-20 ${collapsed ? "lg:pl-20" : "lg:pl-64"} transition-[padding] duration-300`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-charcoal/10 bg-cream/70 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="rounded-lg border border-charcoal/10 bg-white p-2 text-charcoal-soft md:hidden"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <h1 className="font-heading text-xl font-semibold text-charcoal">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="hidden items-center gap-2 rounded-lg border border-charcoal/10 bg-white px-3 py-2 sm:flex">
                <MagnifyingGlassIcon className="h-4 w-4 text-muted" />
                <input
                  placeholder="Search orders…"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchValue.trim()) {
                      router.push(`/orders?q=${encodeURIComponent(searchValue.trim())}`);
                    }
                  }}
                  className="w-36 bg-transparent text-sm text-charcoal placeholder:text-muted focus:outline-none lg:w-52"
                />
              </label>

              <Link
                href="/orders"
                className="relative rounded-lg border border-charcoal/10 bg-white p-2 text-charcoal-soft transition duration-200 hover:shadow-sm"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {pendingOrderCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                    {pendingOrderCount > 99 ? "99+" : pendingOrderCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 transition duration-200 hover:shadow-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-xs font-semibold text-white">
                    {userEmail.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm font-medium text-charcoal lg:block">
                    {tenantName}
                  </span>
                  <ChevronDownIcon className="hidden h-4 w-4 text-muted lg:block" />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-xl">
                      <div className="border-b border-charcoal/5 px-4 py-3">
                        <p className="truncate text-sm font-medium text-charcoal">
                          {tenantName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {userEmail}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
                        >
                          Store Settings
                        </Link>
                        <form action={logOut}>
                          <button
                            type="submit"
                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition duration-150 hover:bg-red-50"
                          >
                            Log out
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
