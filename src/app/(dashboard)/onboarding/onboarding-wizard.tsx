"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  claimSubdomain,
  checkSubdomain,
  completeOnboarding,
  saveBasics,
  saveBranding,
} from "./actions";
import { createClient } from "@/lib/supabase/client";
import { normalizeSubdomain } from "@/lib/tenant";
import { CategoryIcon } from "@/components/category-icon";
import type { BusinessCategory, PlanId, Tenant } from "@/lib/types";

type Props = {
  categories: BusinessCategory[];
  tenant: Tenant | null;
  userFullName?: string;
};

const STEPS = ["Business", "Branding", "Storefront link", "Plan"];

const PALETTES = [
  { primary: "#1b4332", accent: "#d4a017" },
  { primary: "#1d4ed8", accent: "#f97316" },
  { primary: "#166534", accent: "#22d3ee" },
  { primary: "#9d174d", accent: "#facc15" },
  { primary: "#4c1d95", accent: "#fb7185" },
];

const inputClass =
  "w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-3 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function OnboardingWizard({ categories, tenant, userFullName = "" }: Props) {
  const [step, setStep] = useState(tenant?.subdomain ? 3 : 0);
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-charcoal">
          Set up your shop
        </h1>
        <div className="mt-4">
          <Stepper steps={STEPS} current={step} />
        </div>
      </div>

      {step === 0 && (
        <BasicsStep
          tenant={tenant}
          categories={categories}
          userFullName={userFullName}
          onDone={() => {
            router.refresh();
            setStep(1);
          }}
        />
      )}
      {step === 1 && tenant?.id && (
        <BrandingStep tenant={tenant} onDone={() => setStep(2)} />
      )}
      {step === 2 && (
        <SubdomainStep
          tenant={tenant}
          suggestedName={normalizeSubdomain(tenant?.name ?? "")}
          onDone={() => setStep(3)}
        />
      )}
      {step === 3 && <PlanStep tenant={tenant} />}
    </div>
  );
}

function BasicsStep({
  tenant,
  categories,
  onDone,
  userFullName = "",
}: {
  tenant: Tenant | null;
  categories: BusinessCategory[];
  onDone: () => void;
  userFullName?: string;
}) {
  const [state, action, pending] = useActionState(saveBasics, {});
  const existingIds: string[] = tenant?.business_category_ids?.length
    ? tenant.business_category_ids
    : tenant?.business_category_id
      ? [tenant.business_category_id]
      : [];
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(existingIds)
  );

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const ordered = categories.filter((c) => selected.has(c.id));
  const primaryId = ordered.length > 0 ? ordered[0].id : "";

  return (
    <form action={action} className="relative space-y-7 overflow-hidden rounded-2xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] sm:p-9">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal">
          Shop name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={tenant?.name ?? userFullName}
          placeholder="e.g. Adwoa's Boutique"
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <input type="hidden" name="businessCategory" value={primaryId} />
      {ordered.map((c) => (
        <input key={c.id} type="hidden" name="businessCategories" value={c.id} />
      ))}
      <fieldset>
        <legend className="text-sm font-medium text-charcoal">
          What do you sell? (pick one or more)
        </legend>
        {ordered.length > 0 && (
          <p className="mt-1 text-xs text-muted">
            The first category you pick is your primary — it sets your shop&apos;s
            look. Drag to reorder later in Settings.
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {categories.map((cat) => {
            const isSelected = selected.has(cat.id);
            const isPrimary = isSelected && primaryId === cat.id;
            return (
              <label
                key={cat.id}
                className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 px-2 py-4 text-sm font-medium transition duration-200 ${
                  isSelected
                    ? "border-gold bg-gold/[0.06] shadow-md"
                    : "border-charcoal/15 hover:border-charcoal/30"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => toggle(cat.id)}
                />
                <span className="flex justify-center text-charcoal-soft" aria-hidden>
                  <CategoryIcon slug={cat.slug} className="h-6 w-6" />
                </span>
                <span className="text-center text-[11px] leading-tight text-charcoal-soft">
                  {cat.name}
                </span>
                {isPrimary && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-charcoal">
                    1
                  </span>
                )}
                {isSelected && !isPrimary && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal/20 text-[10px] font-bold text-charcoal">
                    {ordered.findIndex((c) => c.id === cat.id) + 1}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <NextButton pending={pending}>Continue</NextButton>
    </form>
  );
}

function BrandingStep({ tenant, onDone }: { tenant: Tenant; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveBranding, {});
  const [logoUrl, setLogoUrl] = useState(tenant.branding?.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(tenant.branding?.bannerUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    tenant.branding?.primaryColor ?? "#1b4332"
  );
  const [accentColor, setAccentColor] = useState(
    tenant.branding?.accentColor ?? "#d4a017"
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  async function upload(kind: "logo" | "banner", file: File) {
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("tenant-assets")
      .upload(`${tenant.id}/${kind}`, file, { upsert: true, cacheControl: "3600" });
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("tenant-assets").getPublicUrl(`${tenant.id}/${kind}`);
    if (kind === "logo") setLogoUrl(publicUrl);
    else setBannerUrl(publicUrl);
    setUploading(false);
  }

  return (
    <form action={action} className="relative space-y-7 overflow-hidden rounded-2xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] sm:p-9">
      <ImageField
        label="Logo"
        hint="Square image. Shown on your storefront."
        value={logoUrl}
        onChange={setLogoUrl}
        onFile={(file) => upload("logo", file)}
        uploading={uploading}
      />
      <ImageField
        label="Banner"
        hint="Wide image, ~1200×400px. Sits behind your shop name."
        value={bannerUrl}
        onChange={setBannerUrl}
        onFile={(file) => upload("banner", file)}
        uploading={uploading}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-charcoal">
            Primary colour
          </label>
          <input
            id="primaryColor"
            name="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-charcoal/15"
          />
        </div>
        <div>
          <label htmlFor="accentColor" className="block text-sm font-medium text-charcoal">
            Accent colour
          </label>
          <input
            id="accentColor"
            name="accentColor"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-charcoal/15"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <button
            key={p.primary}
            type="button"
            onClick={() => {
              setPrimaryColor(p.primary);
              setAccentColor(p.accent);
            }}
            className="flex h-9 w-16 items-center gap-1 rounded-full border border-charcoal/10 bg-white p-1 shadow-sm transition duration-150 hover:shadow-md"
            aria-label={`Use palette ${p.primary}`}
          >
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: p.primary }}
            />
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: p.accent }}
            />
          </button>
        ))}
      </div>

      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input type="hidden" name="bannerUrl" value={bannerUrl} />
      <input type="hidden" name="primaryColor" value={primaryColor} />
      <input type="hidden" name="accentColor" value={accentColor} />

      {uploadError && (
        <p className="text-sm text-red-600" role="alert">
          {uploadError}
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <NextButton pending={pending}>Continue</NextButton>
    </form>
  );
}

function ImageField({
  label,
  hint,
  value,
  onChange,
  onFile,
  uploading,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  onFile: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal">{label}</label>
      <p className="text-xs text-muted">{hint}</p>
      <div className="mt-2 flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt={label}
            className="h-14 w-14 rounded-lg border border-charcoal/10 object-cover"
          />
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal transition duration-150 hover:bg-cream">
          {uploading ? "Uploading…" : "Choose image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-medium text-red-500"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function SubdomainStep({
  tenant,
  suggestedName,
  onDone,
}: {
  tenant: Tenant | null;
  suggestedName: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(claimSubdomain, {});
  const [value, setValue] = useState(tenant?.subdomain ?? suggestedName);
  const [check, setCheck] = useState<{
    available: boolean;
    normalized: string;
    checking: boolean;
    error?: string;
  }>({ available: false, normalized: "", checking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.success) onDone();
  }, [state, onDone]);

  function handleChange(next: string) {
    setValue(next);
    const normalized = normalizeSubdomain(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!normalized) {
      setCheck({ available: false, normalized: "", checking: false });
      return;
    }
    setCheck((c) => ({ ...c, checking: true }));
    timerRef.current = setTimeout(async () => {
      const result = await checkSubdomain(normalized);
      setCheck({ ...result, checking: false });
    }, 400);
  }

  return (
    <form action={action} className="relative space-y-7 overflow-hidden rounded-2xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] sm:p-9">
      <div>
        <label htmlFor="subdomain" className="block text-sm font-medium text-charcoal">
          Storefront link
        </label>
        <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-charcoal/15 bg-cream focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
          <input
            id="subdomain"
            name="subdomain"
            required
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-charcoal focus:outline-none"
            placeholder="yourshopname"
          />
          <span className="whitespace-nowrap bg-cream-soft px-3 py-2.5 text-sm text-muted">
            .venfii.com
          </span>
        </div>
        {value && (
          <p className="mt-2 text-xs text-muted">
            Your store will be at <span className="font-medium text-charcoal">https://{normalizeSubdomain(value)}.venfii.com</span>
          </p>
        )}
        {check.normalized && (
          <p
            className={`mt-2 text-sm ${
              check.available ? "text-green-700" : "text-red-600"
            }`}
          >
            {check.checking
              ? "Checking…"
              : check.available
                ? `✓ ${check.normalized}.venfii.com is available`
                : `✗ ${check.error ?? `${check.normalized}.venfii.com is taken`}`}
          </p>
        )}
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <NextButton pending={pending}>Continue</NextButton>
    </form>
  );
}

function PlanStep({ tenant }: { tenant: Tenant | null }) {
  const [state, action, pending] = useActionState(completeOnboarding, {});
  const [tier, setTier] = useState<PlanId>(
    tenant?.subscription_tier ?? "free"
  );
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");

  const plans: {
    id: PlanId;
    name: string;
    price: string;
    annualPrice: string;
    blurb: string;
    features: string[];
  }[] = [
    {
      id: "free",
      name: "Free",
      price: "GH₵0/mo",
      annualPrice: "GH₵0/yr",
      blurb: "Launch your shop at no cost.",
      features: [
        "6% charge on sales",
        "Up to 20 products",
        "Powered by venfii footer",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: "GH₵100/mo",
      annualPrice: "GH₵1,000/yr",
      blurb: "For getting your first online shop live.",
      features: [
        "Up to 40 products",
        "No charge on sales",
        "Branded storefront",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      price: "GH₵200/mo",
      annualPrice: "GH₵2,000/yr",
      blurb: "For shops ready to sell more, faster.",
      features: [
        "Up to 80 products",
        "No charge on sales",
        "WhatsApp catalogue sync",
        "Mobile money reconciliation",
      ],
    },
    {
      id: "industry",
      name: "Industry",
      price: "GH₵400/mo",
      annualPrice: "GH₵4,000/yr",
      blurb: "Maximum scale for established brands.",
      features: [
        "Unlimited products",
        "No charge on sales",
        "Custom domain",
        "Priority support",
      ],
    },
  ];

  return (
    <form action={action} className="relative space-y-7 overflow-hidden rounded-2xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] sm:p-9">
      <div className="rounded-xl border border-charcoal/10 bg-cream/60 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-charcoal">Billing cycle</span>
          <p className="text-xs text-muted">
            Choose monthly or save with annual billing.
          </p>
        </div>
        <div className="mt-4 inline-flex rounded-xl border border-charcoal/10 bg-white p-1 shadow-sm">
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCycle(option)}
              className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition duration-150 ${
                cycle === option
                  ? "bg-pine text-white shadow-sm"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              {option}
              {option === "annual" && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    cycle === option
                      ? "bg-white/20 text-white"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  save ₵200
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="billingCycle" value={cycle} />

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <label
            key={plan.id}
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-5 transition duration-200 has-[:checked]:border-gold has-[:checked]:bg-gold/[0.06] has-[:checked]:shadow-md ${
              plan.id === tier ? "" : "border-charcoal/10"
            }`}
          >
            <input
              type="radio"
              name="tier"
              value={plan.id}
              checked={tier === plan.id}
              onChange={() => setTier(plan.id)}
              className="sr-only"
            />
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-base font-semibold text-charcoal">
                {plan.name}
              </span>
              <span className="text-sm font-medium text-muted">
                {plan.id === "free"
                  ? "Free"
                  : cycle === "monthly"
                    ? plan.price
                    : plan.annualPrice}
              </span>
            </div>
            <p className="text-xs text-muted">{plan.blurb}</p>
            <ul className="mt-2 space-y-1 text-sm text-charcoal-soft">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-gold" aria-hidden>✓</span> {f}
                </li>
              ))}
            </ul>
          </label>
        ))}
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <NextButton pending={pending}>
        {tier === "free" ? "Finish setup" : "Start plan · pay now"}
      </NextButton>
    </form>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition duration-200 ${
              i < current
                ? "bg-pine text-white"
                : i === current
                  ? "bg-gold text-white shadow-md"
                  : "border border-charcoal/20 bg-white text-muted"
            }`}
          >
            {i < current ? (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </span>
          <span
            className={`hidden text-sm sm:block ${
              i === current
                ? "font-semibold text-charcoal"
                : i < current
                  ? "font-medium text-pine"
                  : "text-muted"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <span
              className={`h-0.5 flex-1 rounded-full ${
                i < current ? "bg-gold" : "bg-charcoal/10"
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function NextButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
