import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "./sign-up-form";
import { VendahLogo } from "@/components/vendah-logo";
import type { BusinessCategory } from "@/lib/types";

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("business_categories")
    .select("id, slug, name, available, sort_order")
    .eq("available", true)
    .order("sort_order");

  return (
    <main className="auth-sign-up-background relative isolate min-h-screen overflow-hidden px-5 py-8 sm:px-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-[30rem] w-[30rem] rounded-full border border-pine/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full border border-gold/20"
      />
      <div className="mx-auto flex w-full max-w-xl flex-col py-2 sm:py-4">
        <Link href="/" className="mb-8 w-fit sm:mb-10">
          <VendahLogo />
        </Link>

        <div className="mb-7 max-w-md sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Start selling today
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            Open your shop
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Set up your account, storefront, and category in three simple steps.
          </p>
        </div>

        <SignUpForm categories={(categories as BusinessCategory[] | null) ?? []} />

        <p className="mt-7 text-center text-sm leading-6 text-muted sm:mt-8">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-pine underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
