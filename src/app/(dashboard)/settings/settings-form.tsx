"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import {
  BuildingStorefrontIcon,
  CheckIcon,
  ClipboardIcon,
  EnvelopeIcon,
  LinkIcon,
  PhoneIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TruckIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { saveSettings, updateSubdomain } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { getStorefrontUrl } from "@/lib/tenant";
import { CategoryIcon } from "@/components/category-icon";
import type { Tenant } from "@/lib/types";

const PRIMARY_SWATCHES = [
  "#1b4332",
  "#1d4ed8",
  "#9d174d",
  "#b45309",
  "#0f766e",
  "#7c3aed",
];

const ACCENT_SWATCHES = [
  "#d4a017",
  "#f97316",
  "#22d3ee",
  "#facc15",
  "#fb7185",
  "#84cc16",
];

const inputClass =
  "w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function SettingsForm({
  tenant,
  subdomain,
  allCategories,
}: {
  tenant: Tenant;
  subdomain: string;
  allCategories: { id: string; slug: string; name: string }[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveSettings, {});
  const [logoUrl, setLogoUrl] = useState(tenant.branding?.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(tenant.branding?.bannerUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    tenant.branding?.primaryColor ?? PRIMARY_SWATCHES[0]
  );
  const [accentColor, setAccentColor] = useState(
    tenant.branding?.accentColor ?? ACCENT_SWATCHES[0]
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subdomainState, subdomainAction, subdomainPending] = useActionState(
    updateSubdomain,
    {}
  );
  const [editingSubdomain, setEditingSubdomain] = useState(false);
  const [subdomainValue, setSubdomainValue] = useState(subdomain);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  const existingIds: string[] = tenant.business_category_ids?.length
    ? tenant.business_category_ids
    : tenant.business_category_id
      ? [tenant.business_category_id]
      : [];
  const [selectedIds, setSelectedIds] = useState<string[]>(existingIds);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  useEffect(() => {
    if (subdomainState.success) {
      setEditingSubdomain(false);
      setSubdomainError(null);
      router.refresh();
    }
    if (subdomainState.error) {
      setSubdomainError(subdomainState.error);
    }
  }, [subdomainState, router]);

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

  function copySubdomain() {
    navigator.clipboard.writeText(getStorefrontUrl(subdomain));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const contact = tenant.contact_info ?? {};

  const availableToAdd = allCategories.filter(
    (c) => !selectedIds.includes(c.id)
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input type="hidden" name="bannerUrl" value={bannerUrl} />
      <input type="hidden" name="primaryColor" value={primaryColor} />
      <input type="hidden" name="accentColor" value={accentColor} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="businessCategories" value={id} />
      ))}
      {selectedIds.length > 0 && (
        <input
          type="hidden"
          name="businessCategory"
          value={selectedIds[0]}
        />
      )}

      {/* Store settings */}
      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
        />
        <h2 className="relative font-heading text-lg font-semibold text-charcoal">
          Store Settings
        </h2>
        <p className="relative mt-1 text-sm text-muted">
          Your shop&apos;s branding and identity.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ImageUpload
            label="Shop logo"
            hint="Square image, shown in your storefront header."
            value={logoUrl}
            uploading={uploading}
            onFile={(file) => upload("logo", file)}
          />
          <ImageUpload
            label="Banner image"
            hint="Wide image, ~1200×400px, sits behind your shop name."
            value={bannerUrl}
            uploading={uploading}
            onFile={(file) => upload("banner", file)}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <LinkIcon className="h-4 w-4 text-pine" /> Storefront link
            </p>
            {editingSubdomain ? (
              <form action={subdomainAction} className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center">
                    <span className="shrink-0 rounded-l-lg border border-r-0 border-charcoal/15 bg-cream-soft px-2.5 py-2.5 text-xs text-muted">
                      https://
                    </span>
                    <input
                      name="newSubdomain"
                      value={subdomainValue}
                      onChange={(e) => {
                        setSubdomainValue(e.target.value);
                        setSubdomainError(null);
                      }}
                      className="w-full flex-1 rounded-r-lg border border-charcoal/15 bg-cream px-3 py-2.5 text-sm text-charcoal focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    <span className="shrink-0 rounded-r-lg border border-l-0 border-charcoal/15 bg-cream-soft px-2.5 py-2.5 text-xs text-muted">
                      .vendah.com
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={subdomainPending || subdomainValue === subdomain}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-pine px-3 py-2.5 text-xs font-semibold text-white transition duration-150 hover:bg-pine/90 disabled:opacity-50"
                  >
                    {subdomainPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubdomain(false);
                      setSubdomainValue(subdomain);
                      setSubdomainError(null);
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white px-3 py-2.5 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream"
                  >
                    Cancel
                  </button>
                </div>
                {subdomainError && (
                  <p className="mt-1.5 text-xs text-red-600">{subdomainError}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  Changing your subdomain will break old links.
                </p>
              </form>
            ) : (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    readOnly
                    value={getStorefrontUrl(subdomain)}
                    className="w-full flex-1 truncate rounded-lg bg-cream-soft px-3 py-2.5 text-sm text-charcoal-soft focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copySubdomain}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white px-3 py-2.5 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-green-600" /> Copied
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSubdomain(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white px-3 py-2.5 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {getStorefrontUrl(subdomain)}
                </p>
              </>
            )}
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <TagIcon className="h-4 w-4 text-pine" /> Business categories
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedIds.map((id, i) => {
                const cat = allCategories.find((c) => c.id === id);
                if (!cat) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/[0.08] px-3 py-1 text-xs font-medium text-charcoal"
                  >
                    {i === 0 && (
                      <span className="rounded bg-gold px-1 text-[9px] font-bold text-charcoal">
                        PRIMARY
                      </span>
                    )}
                    <span className="flex items-center" aria-hidden>
                      <CategoryIcon slug={cat.slug} className="h-4 w-4" />
                    </span>
                    {cat.name}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds((prev) => prev.filter((x) => x !== id))
                      }
                      className="ml-0.5 rounded-full p-0.5 transition duration-150 hover:bg-charcoal/10"
                      aria-label={`Remove ${cat.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              {availableToAdd.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPicker((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-charcoal/25 px-3 py-1 text-xs font-medium text-charcoal-soft transition duration-150 hover:border-gold hover:text-charcoal"
                  >
                    + Add category
                  </button>
                  {showPicker && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-charcoal/10 bg-white p-1.5 shadow-lg">
                      {availableToAdd.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedIds((prev) => [...prev, cat.id]);
                            setShowPicker(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition duration-150 hover:bg-cream"
                        >
                          <span aria-hidden>
                            <CategoryIcon slug={cat.slug} className="h-4 w-4" />
                          </span>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Pick all categories your shop sells in. The first one sets your
              storefront look — you can reorder in onboarding.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
            <BuildingStorefrontIcon className="h-4 w-4 text-pine" /> Brand colour
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Primary
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  {PRIMARY_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      aria-label={`Use ${c}`}
                      className={`h-8 w-8 rounded-full border-2 transition duration-150 ${
                        primaryColor.toLowerCase() === c.toLowerCase()
                          ? "scale-110 border-gold"
                          : "border-white shadow-sm"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-charcoal/25 px-3 text-xs font-medium text-charcoal-soft transition duration-150 hover:border-gold">
                    Custom
                    <input
                      type="color"
                      aria-label="Custom primary colour"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Accent
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  {ACCENT_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      aria-label={`Use ${c}`}
                      className={`h-8 w-8 rounded-full border-2 transition duration-150 ${
                        accentColor.toLowerCase() === c.toLowerCase()
                          ? "scale-110 border-gold"
                          : "border-white shadow-sm"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-charcoal/25 px-3 text-xs font-medium text-charcoal-soft transition duration-150 hover:border-gold">
                    Custom
                    <input
                      type="color"
                      aria-label="Custom accent colour"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-charcoal/10">
              <div
                className="px-4 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name}
              </div>
              <div className="flex items-center justify-between bg-cream px-4 py-3">
                <span className="text-xs text-muted">Live preview</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Shop now
                </span>
              </div>
            </div>
          </div>
        </div>

        {uploadError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}
        {state.error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="relative mt-6 rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-200 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </section>

      {/* Contact details */}
      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
        />
        <h2 className="relative font-heading text-lg font-semibold text-charcoal">
          Contact details
        </h2>
        <p className="mt-1 text-sm text-muted">
          Shown to customers so they can reach you about orders.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <PhoneIcon className="h-4 w-4 text-pine" /> Phone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={contact.phone ?? ""}
              placeholder="+233 24 000 0000"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <EnvelopeIcon className="h-4 w-4 text-pine" /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={contact.email ?? ""}
              placeholder="you@shop.com"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-pine" /> WhatsApp number
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              defaultValue={contact.whatsapp ?? ""}
              placeholder="+233 24 000 0000"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="businessHours" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <ClockIcon className="h-4 w-4 text-pine" /> Business hours
            </label>
            <input
              id="businessHours"
              name="businessHours"
              defaultValue={contact.businessHours ?? ""}
              placeholder="Mon–Sat, 9am–6pm"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="deliveryNotes" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <TruckIcon className="h-4 w-4 text-pine" /> Delivery notes
            </label>
            <textarea
              id="deliveryNotes"
              name="deliveryNotes"
              rows={2}
              defaultValue={contact.deliveryNotes ?? ""}
              placeholder="e.g. Delivery within Accra costs GH₵20."
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="deliveryFeeGhs" className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <TruckIcon className="h-4 w-4 text-pine" /> Delivery fee (GH₵)
            </label>
            <input
              id="deliveryFeeGhs"
              name="deliveryFeeGhs"
              type="number"
              min="0"
              step="0.5"
              defaultValue={tenant.delivery_fee_minor / 100}
              placeholder="0"
              className={`mt-1 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-muted">
              Charged when a customer chooses delivery. Leave at 0 for free
              delivery.
            </p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
              <TruckIcon className="h-4 w-4 text-pine" /> Pickup
            </label>
            <input
              readOnly
              value="Always free"
              className="mt-1 w-full rounded-lg bg-cream-soft px-3 py-2.5 text-sm text-charcoal-soft focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted">
              Customers who choose pickup are never charged a fee.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}

function ImageUpload({
  label,
  hint,
  value,
  uploading,
  onFile,
}: {
  label: string;
  hint: string;
  value: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal">{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-16 w-16 rounded-lg border border-charcoal/10 object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-cream-soft text-xs text-muted">
            none
          </span>
        )}
        <label className="cursor-pointer rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal transition duration-150 hover:bg-cream">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}
