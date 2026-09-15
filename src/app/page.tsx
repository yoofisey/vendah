import Link from "next/link";
import { cookies } from "next/headers";
import {
  CubeIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getUser } from "@/lib/auth";
import { VenfiiLogo } from "@/components/venfii-logo";
import { LandingSplash } from "@/components/landing-splash";
import { ScrollReveal } from "@/components/scroll-reveal";
import { AuthSheet } from "@/components/auth-sheet";
import { AuthTrigger } from "@/components/auth-trigger";
import { PaymentProviders } from "@/components/payment-providers";
import { PricingSection } from "@/components/pricing-section";
import { createClient } from "@/lib/supabase/server";
import type { BusinessCategory } from "@/lib/types";

export default async function Home() {
  const user = await getUser();
  const splashSeen = (await cookies()).get("venfii_splash_seen")?.value === "1";
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("business_categories")
    .select("id, slug, name, available, sort_order")
    .eq("available", true)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-cream">
      <LandingSplash show={!splashSeen} />
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
              <Link
                href="https://vendah-blue.vercel.app/mensfit"
                className="rounded-xl px-4 py-3.5 text-sm font-semibold text-pine underline-offset-4 transition duration-200 hover:underline"
              >
                See a live demo shop →
              </Link>
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
                description="Your own shop at yourname.venfii.com with custom logo, banner and colours."
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
                title="Share, sell &amp; get paid"
                description="Share your storefront link on WhatsApp, Instagram, or your business card. Customers order and pay themselves, and the money lands in your account."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <PaymentProviders />

      <PricingSection />

      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Trusted by sellers
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
                Sellers like you are already on venfii
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <ScrollReveal direction="up" delay={0}>
              <TestimonialCard
                quote="My catalogue finally looks professional. Customers order themselves instead of asking 'is it still available?' on WhatsApp."
                name="Ama K., clothing seller"
                note="Accra · Beta seller"
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <TestimonialCard
                quote="Morning MoMo payments used to mean hours of bank reconciliation. Now my orders and payments line up by themselves."
                name="Kwame A., cosmetics shop"
                note="Kumasi · Beta seller"
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <TestimonialCard
                quote="I set it up in one evening and shared the link on Instagram the next day. First online order came in before I slept."
                name="Efua B., fashion designer"
                note="Takoradi · Beta seller"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-t border-charcoal/5 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal direction="up">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Questions, answered
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
                Payments, payouts &amp; everything between
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">
            <Faq
              q="How do I get paid?"
              a="Every order is paid securely through Paystack. You can accept Visa or Mastercard, plus mobile money (MTN Mobile Money, Vodafone Cash and AirtelTigo Money). You connect your own Paystack or bank details at setup — we never touch your money beyond the platform fee."
            />
            <Faq
              q="How long does a payout take?"
              a="Paystack settles card payments to your account automatically (typically within 24–48 hours). Mobile money payments are reconciled against your orders the same day, and refunds are handled automatically if an order is cancelled."
            />
            <Faq
              q="Can I use my own domain instead of myname.venfii.com?"
              a="Yes. Paid plans can point their own domain (like mybusiness.com) at their storefront. You keep the myname.venfii.com link on all plans, and a custom domain is set up in minutes from the dashboard."
            />
            <Faq
              q="What happens if I go over my product limit?"
              a="Existing products stay live, but you won't be able to add new ones until you upgrade. We'll remind you in the dashboard before you hit the limit so there are no surprises."
            />
            <Faq
              q="Are there any setup or hidden fees?"
              a="No setup fees, no monthly minimums and no cancellation charges. You only ever pay the plan price, and Free has no monthly cost at all — just a small 6% commission per sale."
            />
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
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <VenfiiLogo />
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} Venfii. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
            <a
              href="https://wa.me/233240000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-charcoal"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:support@venfii.com"
              className="hover:text-charcoal"
            >
              support@venfii.com
            </a>
            <Link href="/terms" className="hover:text-charcoal">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-charcoal">
              Privacy
            </Link>
            <Link href="/refund" className="hover:text-charcoal">
              Refunds
            </Link>
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
          <VenfiiLogo />
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

function TestimonialCard({
  quote,
  name,
  note,
}: {
  quote: string;
  name: string;
  note: string;
}) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-xl border border-white/70 bg-cream/60 p-6 shadow-sm">
      <blockquote className="text-sm leading-relaxed text-charcoal-soft">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 border-t border-charcoal/10 pt-4">
        <p className="text-sm font-semibold text-charcoal">{name}</p>
        <p className="text-xs text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-charcoal transition duration-150 group-hover:text-pine">
        {q}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-charcoal/15 text-lg text-muted transition duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
    </details>
  );
}
