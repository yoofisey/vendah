"use client";

import { useActionState, useState } from "react";
import { createSection, type SectionActionState } from "./actions";

const initialState: SectionActionState = {};

const SECTION_TYPES = [
  { value: "hero", label: "Hero banner" },
  { value: "featured_products", label: "Featured products" },
  { value: "banner", label: "Image banner" },
  { value: "text", label: "Text block" },
  { value: "image_text", label: "Image + text" },
  { value: "newsletter", label: "Newsletter signup" },
];

export function SectionForm() {
  const [state, action, pending] = useActionState(createSection, initialState);
  const [open, setOpen] = useState(false);
  const [sectionType, setSectionType] = useState("text");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
      >
        Add section
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                Add homepage section
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-charcoal">
                &times;
              </button>
            </div>
            {state.success ? (
              <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
                Section created successfully.
                <button
                  onClick={() => { setOpen(false); window.location.reload(); }}
                  className="ml-3 underline hover:no-underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form action={action} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sectionType" className="block text-sm font-medium text-charcoal-soft">
                      Section type
                    </label>
                    <select
                      id="sectionType"
                      name="sectionType"
                      value={sectionType}
                      onChange={(e) => setSectionType(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      {SECTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-charcoal-soft">
                      Order
                    </label>
                    <input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      min={0}
                      defaultValue={0}
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-charcoal-soft">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    maxLength={200}
                    placeholder="Section heading"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label htmlFor="subtitle" className="block text-sm font-medium text-charcoal-soft">
                    Subtitle
                  </label>
                  <input
                    id="subtitle"
                    name="subtitle"
                    maxLength={500}
                    placeholder="Short description"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                {(sectionType === "text" || sectionType === "image_text" || sectionType === "newsletter") && (
                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-charcoal-soft">
                      Body text
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      rows={4}
                      placeholder="Content for this section"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                )}
                {(sectionType === "hero" || sectionType === "banner" || sectionType === "image_text") && (
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-charcoal-soft">
                      Image URL
                    </label>
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="linkUrl" className="block text-sm font-medium text-charcoal-soft">
                      Link URL
                    </label>
                    <input
                      id="linkUrl"
                      name="linkUrl"
                      placeholder="/shop or https://..."
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="linkLabel" className="block text-sm font-medium text-charcoal-soft">
                      Link label
                    </label>
                    <input
                      id="linkLabel"
                      name="linkLabel"
                      placeholder="e.g. Shop now"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                {state.error && (
                  <p className="text-sm text-red-600" role="alert">{state.error}</p>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Creating…" : "Create section"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
