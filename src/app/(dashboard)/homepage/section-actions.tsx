"use client";

import { deleteSection, toggleSectionActive } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero banner",
  featured_products: "Featured products",
  banner: "Image banner",
  text: "Text block",
  image_text: "Image + text",
  newsletter: "Newsletter",
};

export function SectionActions({
  id,
  active,
  sectionType,
}: {
  id: string;
  active: boolean;
  sectionType: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-charcoal/5 px-2.5 py-1 text-xs font-medium text-charcoal-soft">
        {TYPE_LABELS[sectionType] ?? sectionType}
      </span>
      <button
        onClick={() => toggleSectionActive(id, !active)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition duration-150 ${
          active
            ? "bg-pine/10 text-pine hover:bg-pine/20"
            : "bg-charcoal/5 text-muted hover:bg-charcoal/10"
        }`}
      >
        {active ? "Visible" : "Hidden"}
      </button>
      <button
        onClick={() => {
          if (window.confirm("Delete this section?")) {
            deleteSection(id);
          }
        }}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}
