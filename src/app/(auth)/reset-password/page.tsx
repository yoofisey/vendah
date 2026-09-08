import Link from "next/link";
import { BrandPanel } from "@/components/auth/brand-panel";
import { VenfiiLogo } from "@/components/venfii-logo";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel
        eyebrow="Password recovery"
        title="Reset your password"
        subtitle="Enter your email and we'll send you a link to get back into your account."
        footer="Remember your password?"
        footerLink={{ label: "Back to sign in", href: "/sign-in" }}
      />

      <section className="relative flex min-h-screen flex-col bg-cream px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gold lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4 lg:py-10">
          <Link href="/" className="mb-8 w-fit lg:hidden">
            <VenfiiLogo />
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
              Forgot password
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-charcoal">
              Reset password
            </h2>
            <p className="mt-2 text-sm text-muted">
              We&apos;ll email you a link to reset your password.
            </p>

            <div className="mt-7 sm:mt-8">
              <ResetPasswordForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
