"use client";

import type { HomepageSection } from "@/lib/homepage-sections";

type PreviewSection = Pick<
  HomepageSection,
  | "section_type"
  | "title"
  | "subtitle"
  | "body"
  | "image_url"
  | "link_url"
  | "link_label"
>;

const PINE = "#1b4332";
const GOLD = "#d4a017";
const CREAM = "#fdf8f0";

export function SectionPreview({ section }: { section: PreviewSection }) {
  switch (section.section_type) {
    case "hero":
      return <HeroPreview section={section} />;
    case "banner":
      return <BannerPreview section={section} />;
    case "image_text":
      return <ImageTextPreview section={section} />;
    case "newsletter":
      return <NewsletterPreview section={section} />;
    case "featured_products":
      return <FeaturedPreview section={section} />;
    case "text":
    default:
      return <TextPreview section={section} />;
  }
}

function HeroPreview({ section }: { section: PreviewSection }) {
  return (
    <div
      className="relative flex h-40 items-center justify-center overflow-hidden rounded-md px-6 text-center"
      style={{ backgroundColor: PINE }}
    >
      {section.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={section.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <div className="relative">
        {section.title && (
          <p className="font-heading text-lg font-bold text-white">
            {section.title}
          </p>
        )}
        {section.subtitle && (
          <p className="mx-auto mt-1 max-w-md text-xs text-white/80">
            {section.subtitle}
          </p>
        )}
        {section.link_url && section.link_label && (
          <span
            className="mt-3 inline-block rounded-md px-4 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: GOLD, color: "#1c1c1e" }}
          >
            {section.link_label}
          </span>
        )}
      </div>
    </div>
  );
}

function BannerPreview({ section }: { section: PreviewSection }) {
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-md px-6 text-center">
      <div className="absolute inset-0" style={{ backgroundColor: CREAM }} />
      {section.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={section.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="relative">
        {section.title && (
          <p className="font-heading text-base font-bold text-white drop-shadow">
            {section.title}
          </p>
        )}
        {section.subtitle && (
          <p className="mt-0.5 max-w-md text-xs text-white/90 drop-shadow">
            {section.subtitle}
          </p>
        )}
        {section.link_url && section.link_label && (
          <span
            className="mt-2 inline-block rounded-md px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: GOLD, color: "#1c1c1e" }}
          >
            {section.link_label}
          </span>
        )}
      </div>
    </div>
  );
}

function ImageTextPreview({ section }: { section: PreviewSection }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-md p-4" style={{ backgroundColor: "#fff" }}>
      {section.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={section.image_url}
          alt=""
          className="h-24 w-full rounded-md object-cover"
        />
      )}
      <div className="flex flex-col justify-center">
        {section.title && (
          <p className="font-heading text-sm font-semibold text-charcoal">
            {section.title}
          </p>
        )}
        {section.subtitle && (
          <p className="mt-1 text-xs text-muted">{section.subtitle}</p>
        )}
        {section.body && (
          <p className="mt-1 line-clamp-2 text-xs text-charcoal-soft">
            {section.body}
          </p>
        )}
      </div>
    </div>
  );
}

function TextPreview({ section }: { section: PreviewSection }) {
  return (
    <div className="rounded-md bg-white px-6 py-5">
      {section.title && (
        <p className="font-heading text-base font-semibold text-charcoal">
          {section.title}
        </p>
      )}
      {section.subtitle && (
        <p className="mt-1 text-xs text-muted">{section.subtitle}</p>
      )}
      {section.body && (
        <p className="mt-2 line-clamp-2 text-xs text-charcoal-soft">
          {section.body}
        </p>
      )}
    </div>
  );
}

function NewsletterPreview({ section }: { section: PreviewSection }) {
  return (
    <div className="rounded-md border border-charcoal/10 bg-white px-6 py-4 text-center">
      {section.title && (
        <p className="font-heading text-sm font-semibold text-charcoal">
          {section.title}
        </p>
      )}
      {section.subtitle && (
        <p className="mt-1 text-xs text-muted">{section.subtitle}</p>
      )}
      <div className="mx-auto mt-3 flex max-w-xs gap-2">
        <div className="h-8 flex-1 rounded-md border border-charcoal/15 bg-cream" />
        <div
          className="flex h-8 w-24 items-center justify-center rounded-md text-[10px] font-semibold text-white"
          style={{ backgroundColor: GOLD, color: "#1c1c1e" }}
        >
          {section.body || "Subscribe"}
        </div>
      </div>
    </div>
  );
}

function FeaturedPreview({ section }: { section: PreviewSection }) {
  return (
    <div className="rounded-md bg-white px-6 py-4">
      {section.title && (
        <p className="font-heading text-base font-semibold text-charcoal">
          {section.title}
        </p>
      )}
      {section.subtitle && (
        <p className="mt-1 text-xs text-muted">{section.subtitle}</p>
      )}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-charcoal/10 p-2">
            <div className="aspect-square rounded-md" style={{ backgroundColor: CREAM }} />
            <div className="mt-2 h-2 w-3/4 rounded bg-charcoal/10" />
            <div className="mt-1 h-2 w-1/2 rounded bg-gold/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
