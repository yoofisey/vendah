import type { StorefrontLayout } from "@/lib/category-presets";

export function productGridClasses(
  layout: StorefrontLayout,
  kind: "all" | "featured"
): string {
  if (layout === "masonry") {
    return kind === "featured"
      ? "columns-2 gap-5 lg:columns-3"
      : "mt-6 columns-2 gap-5 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid";
  }
  if (layout === "dense") {
    return "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";
  }
  if (layout === "editorial") {
    return "mt-6 grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3";
  }
  return "mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4";
}
