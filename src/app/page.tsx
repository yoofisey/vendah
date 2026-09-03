import Link from "next/link";
import {
  CubeIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getUser } from "@/lib/auth";
import { VendahLogo } from "@/components/vendah-logo";
import { PLANS } from "@/lib/plans";
import { LandingSplash } from "@/components/landing-splash";
import { ScrollReveal } from "@/components/scroll-reveal";
import { AuthSheet } from "@/components/auth-sheet";
import { AuthTrigger } from "@/components/auth-trigger";
import { createClient } from "@/lib/supabase/server";
import type { BusinessCategory } from "@/lib/types";

export default async function Home() {
  const user = await getUser();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("business_categories")
    .select("id, slug, name, available, sort_order")
    .eq("available", true)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-cream">
      <LandingSplash />
      <AuthSheet categories={(categories as BusinessCategory[] | null) ?? []} />
      <Navbar isLoggedIn={!!user} />

      <section className="relative overflow-hidden px-5 pt-20 pb-28 sm:px-8 sm:pt-28 sm:pb-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-pine/8 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <ScrollReveal direction="up">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">
              Multi-tenant e-commerce for Ghana
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={100}>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
              Sell smarter with your{" "}
              <span className="text-pine">own online shop</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={200}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Launch a branded storefront in minutes. Accept card &amp; mobile
              money payments. Manage orders, products and customers — all from
              one dashboard.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <AuthTrigger
                mode="signup"
                className="rounded-xl bg-pine px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pine/20 transition duration-200 hover:bg-pine-dark hover:shadow-xl hover:shadow-pine/25 active:translate-y-px"
              >
                Open your shop — it&apos;s free
              </AuthTrigger>
              <AuthTrigger
                mode="signin"
                className="rounded-xl border border-charcoal/15 bg-white px-7 py-3.5 text-sm font-semibold text-charcoal transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
              >
                Sign in
              </AuthTrigger>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={400}>
            <p className="mt-5 text-xs text-muted">
              Free plan available · No credit card required · Setup in 3 minutes
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-charcoal/5 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Everything you need
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
                Your shop, your rules
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
                From product listings to payout — one platform built for Ghanaian
                retailers.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ScrollReveal direction="left" delay={0}>
              <FeatureCard
                icon={<Squares2X2Icon className="h-5 w-5" />}
                title="Branded storefront"
                description="Your own shop at yourname.vendah.com with custom logo, banner and colours."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <FeatureCard
                icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
                title="Mobile money & card"
                description="Accept MTN, Vodafone, AirtelTigo MoMo and card payments via Paystack."
              />
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <FeatureCard
                icon={<CubeIcon className="h-5 w-5" />}
                title="Product management"
                description="Unlimited images, category-specific attributes (size, colour, shade), stock tracking."
              />
            </ScrollReveal>
            <ScrollReveal direction="left" delay={100}>
              <FeatureCard
                icon={<ShoppingBagIcon className="h-5 w-5" />}
                title="Order lifecycle"
                description="Track orders from pending to delivered with email notifications at every step."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <FeatureCard
                icon={<UserGroupIcon className="h-5 w-5" />}
                title="Customer insights"
                description="See who's buying, what they've ordered, and how much they've spent."
              />
            </ScrollReveal>
            <ScrollReveal direction="right" delay={300}>
              <FeatureCard
                icon={<ShieldCheckIcon className="h-5 w-5" />}
                title="Secure & reliable"
                description="Row-level security, encrypted payments, and 99.9% uptime on Supabase."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                How it works
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
                Three steps to your first sale
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <ScrollReveal direction="left" delay={0}>
              <StepCard
                number={1}
                title="Create your account"
                description="Sign up with your email, choose your shop name and business category."
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <StepCard
                number={2}
                title="Set up your shop"
                description="Add products, upload photos, connect your Paystack account for payouts."
              />
            </ScrollReveal>
            <ScrollReveal direction="right" delay={300}>
              <StepCard
                number={3}
                title="Share & sell"
                description="Share your storefront link on WhatsApp, Instagram, or your business card."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-t border-charcoal/5 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Simple pricing
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
                Start free, upgrade when you&apos;re ready
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
                No hidden fees. Pay only when you grow.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(PLANS).map(([id, plan], i) => (
              <ScrollReveal key={id} direction="up" delay={i * 100}>
                <PricingCard
                  name={plan.name}
                  monthlyPrice={plan.monthlyGhs}
                  productLimit={
                    plan.productLimit === null
                      ? "Unlimited products"
                      : `${plan.productLimit} products`
                  }
                  fee={
                    plan.salesFeePct > 0
                      ? `${plan.salesFeePct}% per sale`
                      : "0% per sale"
                  }
                  highlighted={id === "free"}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <ScrollReveal direction="up">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
              Ready to start selling?
            </h2>
            <p className="mt-4 text-base text-muted">
              Open your shop in minutes and start taking orders — no merchant
              fees to get going.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <AuthTrigger
                mode="signup"
                className="rounded-xl bg-pine px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-pine/20 transition duration-200 hover:bg-pine-dark hover:shadow-xl hover:shadow-pine/25 active:translate-y-px"
              >
                Open your shop — it&apos;s free
              </AuthTrigger>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-charcoal/5 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <VendahLogo />
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Vendah. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <a
              href="mailto:support@vendah.com"
              className="hover:text-charcoal"
            >
              Support
            </a>
            <AuthTrigger
              mode="signin"
              className="hover:text-charcoal"
            >
              Sign in
            </AuthTrigger>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-charcoal/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/">
          <VendahLogo />
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <AuthTrigger
                mode="signin"
                className="text-sm font-medium text-charcoal-soft transition duration-200 hover:text-charcoal"
              >
                Sign in
              </AuthTrigger>
              <AuthTrigger
                mode="signup"
                className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark"
              >
                Open your shop
              </AuthTrigger>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/70 bg-cream/60 p-6 transition duration-200 hover:-translate-y-0.5 hover:border-pine/20 hover:bg-white hover:shadow-[0_16px_40px_-24px_rgba(27,67,50,0.2)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine/10 text-pine transition duration-200 group-hover:bg-pine group-hover:text-white">
        {icon}
      </span>
      <h3 className="mt-4 font-heading text-lg font-semibold text-charcoal">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine text-lg font-bold text-white">
        {number}
      </span>
      <h3 className="mt-5 font-heading text-lg font-semibold text-charcoal">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  monthlyPrice,
  productLimit,
  fee,
  highlighted,
}: {
  name: string;
  monthlyPrice: number;
  productLimit: string;
  fee: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-6 transition duration-200 hover:-translate-y-0.5 ${
        highlighted
          ? "border-pine/30 bg-pine text-white shadow-lg shadow-pine/20"
          : "border-white/70 bg-cream/60 hover:border-pine/20 hover:bg-white hover:shadow-[0_16px_40px_-24px_rgba(27,67,50,0.2)]"
      }`}
    >
      {highlighted && (
        <span className="absolute right-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <h3
        className={`font-heading text-xl font-semibold ${highlighted ? "text-white" : "text-charcoal"}`}
      >
        {name}
      </h3>
      <div className="mt-4">
        <span
          className={`font-heading text-3xl font-semibold ${highlighted ? "text-white" : "text-charcoal"}`}
        >
          {monthlyPrice === 0 ? "Free" : `₵${monthlyPrice}`}
        </span>
        {monthlyPrice > 0 && (
          <span
            className={`ml-1 text-sm ${highlighted ? "text-white/70" : "text-muted"}`}
          >
            /month
          </span>
        )}
      </div>
      <div className="mt-6 space-y-2.5">
        <PricingFeature
          text={productLimit}
          muted={highlighted}
        />
        <PricingFeature text={fee} muted={highlighted} />
        <PricingFeature
          text={monthlyPrice === 0 ? "6% sales commission" : "0% sales commission"}
          muted={highlighted}
        />
        <PricingFeature
          text={monthlyPrice === 0 ? "Powered by Vendah footer" : "No Vendah branding"}
          muted={highlighted}
        />
      </div>
      <AuthTrigger
        mode="signup"
        className={`mt-7 block w-full rounded-lg py-3 text-center text-sm font-semibold transition duration-200 ${
          highlighted
            ? "bg-white text-pine hover:bg-cream"
            : "bg-pine text-white hover:bg-pine-dark"
        }`}
      >
        Get started
      </AuthTrigger>
    </div>
  );
}

function PricingFeature({
  text,
  muted,
}: {
  text: string;
  muted: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <SparklesIcon
        className={`h-4 w-4 shrink-0 ${muted ? "text-gold-light" : "text-gold"}`}
      />
      <span
        className={`text-sm ${muted ? "text-white/80" : "text-charcoal-soft"}`}
      >
        {text}
      </span>
    </div>
  );
}
