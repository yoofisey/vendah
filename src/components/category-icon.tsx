"use client";

import {
  BookOpenIcon,
  DevicePhoneMobileIcon,
  HeartIcon,
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

function ShirtIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

function JewelryIcon({ className = "h-5 w-5" }: { className?: string }) {
  const size = className?.includes("h-6") || className?.includes("w-6") ? "24px"
    : className?.includes("h-8") || className?.includes("w-8") ? "32px"
    : "20px";
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        display: "inline-block",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        direction: "ltr",
        fontFeatureSettings: "normal",
        fontVariationSettings: "normal",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      jewelry
    </span>
  );
}

function CosmeticsIcon({ className = "h-5 w-5" }: { className?: string }) {
  const size = className?.includes("h-6") || className?.includes("w-6") ? "24px"
    : className?.includes("h-8") || className?.includes("w-8") ? "32px"
    : "20px";
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        display: "inline-block",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        direction: "ltr",
        fontFeatureSettings: "normal",
        fontVariationSettings: "normal",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      health_and_beauty
    </span>
  );
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  clothing: ShirtIcon,
  cosmetics: CosmeticsIcon,
  jewelry: JewelryIcon,
  groceries: ShoppingCartIcon,
  electronics: DevicePhoneMobileIcon,
  "home-living": HomeIcon,
  "health-wellness": HeartIcon,
  "books-stationery": BookOpenIcon,
  other: ShoppingBagIcon,
};

export function CategoryIcon({
  slug,
  className = "h-5 w-5",
}: {
  slug: string;
  className?: string;
}) {
  const Icon = ICON_MAP[slug] ?? ShoppingBagIcon;
  return <Icon className={className} />;
}
