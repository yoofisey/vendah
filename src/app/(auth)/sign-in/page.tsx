import Link from "next/link";
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { SignInForm } from "./sign-in-form";
import { BrandPanel } from "@/components/auth/brand-panel";
import { VendahLogo } from "@/components/vendah-logo";

const iconClass = "h-5 w-5";

const stats = [
  {
    label: "Active retailers",
    value: "2,400+",
    delta: "+18% this month",
    icon: <ArrowTrendingUpIcon className={iconClass} />,
  },
  {
    label: "Revenue processed",
    value: "₵4.8M",
    delta: "monthly GHS volume",
    icon: <BanknotesIcon className={iconClass} />,
  },
  {
    label: "Orders fulfilled",
    value: "1,204",
    delta: "today",
    icon: <CheckBadgeIcon className={iconClass} />,
  },
];

export default function SignInPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel
        eyebrow="Retailer sign in"
        title="Welcome back to your shop"
        subtitle="Storefront, orders and payouts — all in one calm place."
        stats={stats}
        footer="Join 2,400+ retailers already selling smarter"
      />

      <section className="relative flex min-h-screen flex-col bg-cream px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gold lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4 lg:py-10">
          <Link href="/" className="mb-8 w-fit lg:hidden">
            <VendahLogo />
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-charcoal/10 bg-white px-6 py-8 shadow-[0_24px_56px_-30px_rgba(27,67,50,0.42)] sm:px-10 sm:py-10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#d4a017_45%,#b8870f_55%,transparent)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -top-24 right-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl"
              aria-hidden
            />

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
              Retailer access
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-charcoal">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-muted">
              Manage products, orders and payouts from one place.
            </p>

            <div className="mt-7 sm:mt-8">
              <SignInForm />
            </div>
          </div>

          <p className="mt-7 text-center text-sm leading-6 text-muted sm:mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-pine underline-offset-4 hover:underline"
            >
              Open your shop →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
