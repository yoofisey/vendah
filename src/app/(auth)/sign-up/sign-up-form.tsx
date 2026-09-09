"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useActionState,
} from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { createShop, type AuthState } from "../actions";
import { checkSubdomain } from "@/app/(dashboard)/onboarding/actions";
import { getCategoryPreset } from "@/lib/category-presets";
import { normalizeSubdomain } from "@/lib/tenant";
import { CategoryIcon } from "@/components/category-icon";
import { Field, fieldInputBase } from "@/components/auth/field";
import { createClient } from "@/lib/supabase/client";
import type { BusinessCategory } from "@/lib/types";
import { useAuthTransition } from "@/components/auth-transition-splash";

async function signUpWithGoogle(): Promise<{ error?: string } | undefined> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { error: error.message };
}

async function signUpWithFacebook(): Promise<{ error?: string } | undefined> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { error: error.message };
}

const initialState: AuthState = {};

const STEPS = ["Account", "Shop Details", "Category"];

const STEP_META = [
  {
    title: "Create your account",
    subtitle: "You'll sign in with these details every time.",
  },
  {
    title: "Set up your storefront",
    subtitle: "Pick a name, your link and a brand colour.",
  },
  {
    title: "Pick your category",
    subtitle: "We'll tailor your dashboard and storefront to you.",
  },
];

const PRIMARY_SWATCHES = [
  "#1b4332",
  "#1d4ed8",
  "#9d174d",
  "#b45309",
  "#0f766e",
  "#7c3aed",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(v: string): string | null {
  return v.trim().length >= 2 ? null : "Enter your full name.";
}

function validateEmail(v: string): string | null {
  if (!v) return "Enter your email address.";
  return EMAIL_RE.test(v) ? null : "That doesn't look like a valid email.";
}

function validatePhone(v: string): string | null {
  return v.replace(/\D/g, "").length >= 7
    ? null
    : "Enter a valid phone number.";
}

function validatePassword(v: string): string | null {
  if (!v) return "Create a password.";
  return v.length >= 8
    ? null
    : "Use at least 8 characters for security.";
}

function validateConfirm(v: string, pw: string): string | null {
  return v === pw ? null : "Passwords don't match.";
}

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-lime-500",
  "bg-green-600",
];

export function SignUpForm({ categories }: { categories: BusinessCategory[] }) {
  const [state, action, pending] = useActionState(createShop, initialState);
  const [step, setStep] = useState(0);

  // Step 1 — account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  // Step 2 — shop details
  const [shopName, setShopName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_SWATCHES[0]);
  const [customColor, setCustomColor] = useState("");
  const [colorTouched, setColorTouched] = useState(false);

  // Step 3 — categories (multi-select)
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [categoryTouched, setCategoryTouched] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { begin, end } = useAuthTransition();

  useEffect(() => {
    if (state.error || state.needEmailConfirmation) end();
  }, [state.error, state.needEmailConfirmation, end]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
    terms: false,
    shopName: false,
  });

  const touch = (key: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const normalized = normalizeSubdomain(shopName);
  const [check, setCheck] = useState<{
    available: boolean;
    normalized: string;
    checking: boolean;
    error?: string;
  }>({ available: false, normalized: "", checking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleShopNameChange(next: string) {
    setShopName(next);
    const normalizedName = normalizeSubdomain(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!normalizedName) {
      setCheck({ available: false, normalized: "", checking: false });
      return;
    }
    setCheck((c) =>
      c.normalized === normalizedName ? c : { ...c, checking: true }
    );
    timerRef.current = setTimeout(async () => {
      const result = await checkSubdomain(normalizedName);
      setCheck({ ...result, checking: false });
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.error?.includes("security purposes")) {
      const match = state.error.match(/(\d+)\s*second/);
      const seconds = match ? parseInt(match[1], 10) : 45;
      setCooldown(seconds);
    }
  }, [state.error]);

  const selectedColor = customColor || primaryColor;
  const subdomainOk =
    !!check.normalized && check.available && !check.checking;

  function canProceed(stepToValidate: number): boolean {
    if (stepToValidate === 0) {
      const checks = [
        [validateName(name), () => touch("name")],
        [validateEmail(email), () => touch("email")],
        [validatePhone(phone), () => touch("phone")],
        [validatePassword(password), () => touch("password")],
        [validateConfirm(confirm, password), () => touch("confirm")],
      ] as const;
      for (const [message, markTouched] of checks) {
        if (message) {
          markTouched();
          setLocalError(message);
          return false;
        }
      }
      if (!terms) {
        setTouched((t) => ({ ...t, terms: true }));
        setLocalError("Accept the terms to continue.");
        return false;
      }
      return true;
    }
    if (stepToValidate === 1) {
      if (shopName.trim().length < 2) {
        touch("shopName");
        setLocalError("Enter your shop name.");
        return false;
      }
      if (!subdomainOk) {
        setLocalError(
          check.checking
            ? "Hold on — still checking your storefront link…"
            : check.error ?? "That storefront link is taken."
        );
        return false;
      }
      return true;
    }
    if (stepToValidate === 2) {
      return true;
    }
    return true;
  }

  function handleNext() {
    setLocalError(null);
    if (canProceed(step)) setStep((s) => s + 1);
  }

  if (state.needEmailConfirmation) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-10 text-center shadow-[0_30px_70px_-32px_rgba(27,67,50,0.45)] backdrop-blur">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#d4a017_45%,#b8870f_55%,transparent)]"
          aria-hidden
        />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
          <InboxIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-5 font-heading text-2xl font-semibold text-charcoal">
          Check your email
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          We sent a confirmation link to{" "}
          <span className="font-medium text-charcoal">{email}</span>. Activate
          your account, then sign in to finish launching your shop.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-xs text-muted">
          Didn&apos;t see it? Check your spam folder or try again in a moment.
        </p>
      </div>
    );
  }

  const strength = passwordStrength(password);

  return (
    <form
      action={action}
      className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 px-6 py-7 shadow-[0_30px_70px_-32px_rgba(27,67,50,0.45)] backdrop-blur sm:px-9 sm:py-9"
      noValidate
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        const emailOk = String(data.get("email") ?? "").trim().length > 0;
        const passwordOk = String(data.get("password") ?? "").length >= 8;
        if (emailOk && passwordOk) begin("Launching your shop…");
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#d4a017_45%,#b8870f_55%,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 right-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />
      <Stepper step={step} />

      {cooldown > 0 && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-3 text-sm text-charcoal-soft">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
          Too many attempts. Wait{" "}
          <span className="font-semibold tabular-nums text-charcoal">{cooldown}s</span>{" "}
          before trying again.
        </div>
      )}

      <div className="mt-8 sm:mt-9">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-charcoal">
          {STEP_META[step].title}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {STEP_META[step].subtitle}
        </p>
      </div>

      {(state.error || localError || oauthError) && (
        <div
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          role="alert"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <span>
            {oauthError ??
              localError ??
              (state.error?.includes("security purposes")
                ? "Too many attempts. Please wait a moment before trying again."
                : state.error)}
          </span>
        </div>
      )}

      <div key={step} className="animate-step-in mt-8 sm:mt-9">
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setOauthError(null);
                  const res = await signUpWithGoogle();
                  if (res?.error) setOauthError(res.error);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm font-medium text-charcoal transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={async () => {
                  setOauthError(null);
                  const res = await signUpWithFacebook();
                  if (res?.error) setOauthError(res.error);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm font-medium text-charcoal transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
              >
                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-charcoal/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted">or continue with email</span>
              </div>
            </div>
            <Field
              id="name"
              name="name"
              label="Full name"
              placeholder="Ama Mensah"
              autoComplete="name"
              value={name}
              onChange={setName}
              onBlur={() => touch("name")}
              error={touched.name ? validateName(name) : null}
              valid={touched.name && !validateName(name)}
              required
            />

            <Field
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              onBlur={() => touch("email")}
              error={touched.email ? validateEmail(email) : null}
              valid={touched.email && !validateEmail(email)}
              required
            />

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-charcoal"
              >
                Phone number
              </label>
              <div
                className={`flex items-stretch overflow-hidden rounded-xl border bg-cream transition duration-200 focus-within:bg-white ${
                  touched.phone && validatePhone(phone)
                    ? "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200/70"
                    : touched.phone
                      ? "border-emerald-400/70 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200/70"
                      : "border-charcoal/15 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30"
                }`}
              >
                <span className="flex select-none items-center gap-1.5 border-r border-charcoal/10 px-3.5 text-sm text-charcoal-soft">
                  <span aria-hidden className="text-xs font-semibold text-muted">GH</span>+233
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="24 123 4567"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d\s()-]/g, ""))
                  }
                  onBlur={() => touch("phone")}
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-charcoal placeholder:text-muted focus:outline-none"
                />
              </div>
              {touched.phone ? (
                validatePhone(phone) ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    {validatePhone(phone)}
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                    We&apos;ll send order updates here.
                  </p>
                )
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Your MTN MoMo number — this is where payouts land.
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  className={`${fieldInputBase} ${
                    touched.password && validatePassword(password)
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200/70"
                      : "border-charcoal/15 focus:border-gold focus:ring-gold/30"
                  } px-4 pr-12 py-3`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition duration-200 hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex flex-1 gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                        strength >= i
                          ? STRENGTH_COLOR[strength]
                          : "bg-charcoal/10"
                      }`}
                    />
                  ))}
                </div>
                {password && (
                  <span
                    className={`text-xs font-semibold ${
                      strength <= 1
                        ? "text-red-600"
                        : strength === 2
                          ? "text-orange-600"
                          : strength === 3
                            ? "text-lime-600"
                            : "text-green-700"
                    }`}
                  >
                    {STRENGTH_LABEL[strength]}
                  </span>
                )}
              </div>

              {touched.password && validatePassword(password) && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                  {validatePassword(password)}
                </p>
              )}
            </div>

            <Field
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              onBlur={() => touch("confirm")}
              error={touched.confirm ? validateConfirm(confirm, password) : null}
              valid={
                touched.confirm && !validateConfirm(confirm, password)
              }
              validText="Passwords match."
              required
            />

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal-soft">
              <input
                type="checkbox"
                name="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-charcoal/20 accent-pine"
              />
              <span>
                I agree to the{" "}
                <a
                  href="#"
                  className="font-medium text-pine underline-offset-4 hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-medium text-pine underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {touched.terms && !terms && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                Accept the terms to continue.
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <Field
              id="shopName"
              name="shopName"
              label="Shop name"
              placeholder="Adwoa's Boutique"
              autoComplete="organization"
              value={shopName}
              onChange={handleShopNameChange}
              onBlur={() => touch("shopName")}
              error={
                touched.shopName && shopName.trim().length < 2
                  ? "Enter a shop name."
                  : null
              }
              hint="This is how customers will know you."
              required
            />

            <div>
              <p className="mb-1.5 text-sm font-medium text-charcoal">
                Storefront link
              </p>
              <div className="flex items-center gap-3">
                <span className="flex flex-1 items-center gap-2 truncate rounded-xl border border-dashed border-charcoal/20 bg-cream px-4 py-3 text-sm text-charcoal">
                  <GlobeAltIcon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate font-medium">
                    {normalized || "yourshopname"}
                  </span>
                  <span className="text-muted">.venfii.com</span>
                </span>
                {normalized && (
                  <span className="shrink-0">
                    {check.checking ? (
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-charcoal/25 border-t-pine" />
                        Checking…
                      </span>
                    ) : check.available ? (
                      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckIcon className="h-3.5 w-3.5" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        {check.error ?? "Taken"}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                This becomes your shop&apos;s address — you can change it later.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <UploadField
                label="Shop logo"
                hint="Square, PNG or JPG."
                file={logo}
                onFile={setLogo}
              />
              <UploadField
                label="Banner image"
                hint="Wide, ~1200×400px."
                file={banner}
                onFile={setBanner}
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-charcoal">
                Brand colour
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRIMARY_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(c);
                      setCustomColor("");
                      setColorTouched(true);
                    }}
                    aria-label={`Use ${c}`}
                    className={`h-9 w-9 rounded-full border-2 transition duration-150 ${
                      selectedColor.toLowerCase() === c.toLowerCase()
                        ? "scale-110 border-gold ring-2 ring-gold/30"
                        : "border-white shadow-sm hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-charcoal/25 px-3 text-xs font-medium text-charcoal-soft transition duration-150 hover:border-gold">
                  Custom
                  <input
                    type="color"
                    aria-label="Custom brand colour"
                    value={customColor || "#ffffff"}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setPrimaryColor(e.target.value);
                      setColorTouched(true);
                    }}
                    className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-md border border-charcoal/10"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {selectedColor}
                </span>
              </div>
            </div>

          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm font-medium text-charcoal">What do you sell?</p>
            <p className="mt-1 text-xs text-muted">
              Pick one or more — the first one sets your shop&apos;s look.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((cat) => {
                const selected = categoryIds.has(cat.id);
                const order = selected
                  ? [...categoryIds].indexOf(cat.id) + 1
                  : 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryTouched(true);
                      setCategoryIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.id)) {
                          next.delete(cat.id);
                        } else {
                          next.add(cat.id);
                        }
                        return next;
                      });
                      if (!colorTouched) {
                        setPrimaryColor(getCategoryPreset(cat.slug).palette.primary);
                      }
                    }}
                    aria-pressed={selected}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-4 text-sm font-medium transition duration-200 ${
                      selected
                        ? "border-gold bg-gold/[0.06] text-charcoal shadow-md"
                        : "border-charcoal/10 bg-cream text-charcoal-soft hover:border-charcoal/25 hover:shadow-sm"
                    }`}
                  >
                    <span className="flex justify-center text-charcoal-soft" aria-hidden>
                      <CategoryIcon slug={cat.slug} className="h-6 w-6" />
                    </span>
                    <span className="text-center text-[11px] leading-tight">
                      {cat.name}
                    </span>
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-charcoal">
                        {order}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {categoryTouched && categoryIds.size > 0 && (
              <p className="mt-2 text-xs text-pine font-medium">
                {categoryIds.size} {categoryIds.size === 1 ? "category" : "categories"} selected
              </p>
            )}
          </div>
        )}
      </div>

      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="terms" value={terms ? "on" : ""} />
      <input type="hidden" name="shopName" value={shopName} />
      <input type="hidden" name="subdomain" value={normalized} />
      <input type="hidden" name="primaryColor" value={selectedColor} />
      <input type="hidden" name="businessCategory" value={[...categoryIds][0] ?? ""} />
      {[...categoryIds].map((id) => (
        <input key={id} type="hidden" name="businessCategories" value={id} />
      ))}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-charcoal/10 pt-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              setStep((s) => s - 1);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm font-medium text-charcoal-soft transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            className="group flex items-center gap-2 rounded-xl bg-pine px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pine/20 transition duration-200 hover:-translate-y-px hover:bg-pine-dark hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/40 active:translate-y-0.5"
          >
            Continue
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || cooldown > 0}
            className="group flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-pine-dark shadow-lg shadow-gold/25 transition duration-200 hover:-translate-y-px hover:bg-gold-dark hover:text-white hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gold/50 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-pine-dark/40 border-t-pine-dark" />
                Launching your shop…
              </>
            ) : cooldown > 0 ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-pine-dark/40 border-t-pine-dark" />
                Wait {cooldown}s
              </>
            ) : (
              <>
                Launch my shop
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition duration-200 ${
              i < step
                ? "bg-pine text-white"
                : i === step
                  ? "bg-gold text-white"
                  : "border border-charcoal/20 bg-white text-muted"
            }`}
          >
            {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </span>
          <span
            className={`hidden text-sm sm:block ${
              i === step
                ? "font-semibold text-charcoal"
                : i < step
                  ? "font-medium text-pine"
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
        </li>
      ))}
    </ol>
  );
}

function UploadField({
  label,
  hint,
  file,
  onFile,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-charcoal">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-charcoal/20 bg-cream px-4 py-3 transition duration-200 hover:border-gold hover:bg-white">
        {file ? (
          <>
            <FilePreview file={file} />
            <span className="flex-1 truncate text-sm text-charcoal">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
              <UploadIcon />
            </span>
            <span className="flex-1 text-sm text-charcoal-soft">
              Choose image{" "}
              <span className="text-muted">or drag &amp; drop</span>
            </span>
          </>
        )}
        <input
          type="file"
          name={label.toLowerCase().includes("banner") ? "banner" : "logo"}
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) onFile(picked);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function FilePreview({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <img
      src={url}
      alt=""
      className="h-10 w-10 rounded-lg border border-charcoal/10 object-cover"
    />
  );
}

function UploadIcon() {
  return (
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
