export type StorefrontLayout = "default" | "editorial" | "masonry" | "dense";

export type CardStyle = "standard" | "editorial" | "luxe" | "compact";

export type CategoryPreset = {
  slug: string;
  name: string;
  palette: { primary: string; accent: string };
  layout: StorefrontLayout;
  cardStyle: CardStyle;
  tagline: string;
  heroSubtitle: string;
};

export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  clothing: {
    slug: "clothing",
    name: "Clothing & Fashion",
    palette: { primary: "#0f172a", accent: "#f59e0b" },
    layout: "editorial",
    cardStyle: "editorial",
    tagline: "Curated fashion, delivered with care",
    heroSubtitle:
      "Fresh looks for every season — browse the collection and check out in under a minute.",
  },
  cosmetics: {
    slug: "cosmetics",
    name: "Cosmetics & Beauty",
    palette: { primary: "#9f1239", accent: "#fb7185" },
    layout: "editorial",
    cardStyle: "luxe",
    tagline: "Beauty essentials, hand-picked for you",
    heroSubtitle:
      "Glow up with trusted beauty brands — browse and check out in under a minute.",
  },
  jewelry: {
    slug: "jewelry",
    name: "Jewelry & Accessories",
    palette: { primary: "#111827", accent: "#d4af37" },
    layout: "masonry",
    cardStyle: "luxe",
    tagline: "Timeless pieces, delivered with care",
    heroSubtitle:
      "Discover hand-picked jewellery and accessories — browse and order in minutes.",
  },
  groceries: {
    slug: "groceries",
    name: "Food & Groceries",
    palette: { primary: "#166534", accent: "#f97316" },
    layout: "dense",
    cardStyle: "compact",
    tagline: "Everyday essentials, delivered fresh",
    heroSubtitle:
      "Stock up on daily essentials — order online and skip the queue.",
  },
  electronics: {
    slug: "electronics",
    name: "Electronics",
    palette: { primary: "#0f172a", accent: "#3b82f6" },
    layout: "dense",
    cardStyle: "compact",
    tagline: "The tech you need, delivered to you",
    heroSubtitle:
      "Gadgets and more at honest prices — browse and order in minutes.",
  },
  "home-living": {
    slug: "home-living",
    name: "Home & Living",
    palette: { primary: "#365314", accent: "#d97706" },
    layout: "default",
    cardStyle: "standard",
    tagline: "Make your space feel like home",
    heroSubtitle:
      "Beautiful pieces for your home — browse the collection and order in minutes.",
  },
  "health-wellness": {
    slug: "health-wellness",
    name: "Health & Wellness",
    palette: { primary: "#064e3b", accent: "#34d399" },
    layout: "default",
    cardStyle: "standard",
    tagline: "Trusted wellness, delivered with care",
    heroSubtitle:
      "Health essentials you can count on — browse the catalogue and check out in under a minute.",
  },
  "books-stationery": {
    slug: "books-stationery",
    name: "Books & Stationery",
    palette: { primary: "#451a03", accent: "#ca8a04" },
    layout: "editorial",
    cardStyle: "editorial",
    tagline: "Great reads, stationery and more",
    heroSubtitle:
      "Everything for the book lover — browse the shelves and order in minutes.",
  },
  other: {
    slug: "other",
    name: "Other",
    palette: { primary: "#1b4332", accent: "#d4a017" },
    layout: "default",
    cardStyle: "standard",
    tagline: "Your favourite finds, delivered with care",
    heroSubtitle:
      "Fresh finds, hand-picked just for you. Browse the catalogue and check out in under a minute.",
  },
};

export function getCategoryPreset(slug: string | null | undefined): CategoryPreset {
  if (slug && CATEGORY_PRESETS[slug]) return CATEGORY_PRESETS[slug];
  return CATEGORY_PRESETS.other;
}
