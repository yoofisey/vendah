"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSection } from "@/lib/homepage-sections";
import {
  createSection,
  updateSection,
  deleteSection,
} from "@/app/(dashboard)/homepage/actions";
import { SectionPreview } from "@/components/dashboard/homepage/section-preview";

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero banner",
  featured_products: "Featured products",
  banner: "Image banner",
  text: "Text block",
  image_text: "Image + text",
  newsletter: "Newsletter",
};

const PALETTE: { type: string; label: string; desc: string }[] = [
  { type: "hero", label: "Hero banner", desc: "Big headline at the top" },
  { type: "featured_products", label: "Featured products", desc: "Showcase products" },
  { type: "banner", label: "Image banner", desc: "Wide promotional banner" },
  { type: "text", label: "Text block", desc: "Simple heading + body" },
  { type: "image_text", label: "Image + text", desc: "Two columns with image" },
  { type: "newsletter", label: "Newsletter", desc: "Collect emails" },
];

type TemplateBlock = {
  type: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  link_url?: string;
  link_label?: string;
  active: boolean;
};

type Template = {
  id: string;
  name: string;
  desc: string;
  blocks: TemplateBlock[];
};

const TEMPLATES: Template[] = [
  {
    id: "classic-store",
    name: "Classic Store",
    desc: "Hero, featured products and a promo banner.",
    blocks: [
      {
        type: "hero",
        title: "Welcome to your store",
        subtitle: "Discover fresh arrivals and best sellers every week.",
        link_url: "/shop",
        link_label: "Shop now",
        active: true,
      },
      {
        type: "featured_products",
        title: "Featured products",
        subtitle: "Hand-picked favourites our customers love.",
        active: true,
      },
      {
        type: "banner",
        title: "Free delivery on orders over GH₵200",
        subtitle: "Limited time offer — shop today.",
        link_url: "/shop",
        link_label: "Shop the sale",
        active: true,
      },
      {
        type: "newsletter",
        title: "Stay in the loop",
        subtitle: "Get exclusive offers and new arrivals first.",
        body: "Subscribe",
        active: true,
      },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean and simple — text with featured products.",
    blocks: [
      {
        type: "text",
        title: "Quality you can trust",
        subtitle: "Simple, honest products made to last.",
        body: "Everything in our store is carefully selected and built to stand the test of time.",
        active: true,
      },
      {
        type: "featured_products",
        title: "Our best sellers",
        subtitle: "The pieces everyone is talking about.",
        active: true,
      },
      {
        type: "newsletter",
        title: "Join our list",
        subtitle: "Occasional updates, zero spam.",
        body: "Subscribe",
        active: true,
      },
    ],
  },
  {
    id: "promo-focus",
    name: "Promo Focus",
    desc: "Push a sale or campaign front and centre.",
    blocks: [
      {
        type: "hero",
        title: "End of season sale",
        subtitle: "Up to 50% off selected styles while stocks last.",
        link_url: "/shop",
        link_label: "Shop the sale",
        active: true,
      },
      {
        type: "banner",
        title: "Bundle & save",
        subtitle: "Buy more, save more across the whole range.",
        link_url: "/shop",
        link_label: "View bundles",
        active: true,
      },
      {
        type: "featured_products",
        title: "Trending now",
        subtitle: "What everyone is adding to their cart.",
        active: true,
      },
      {
        type: "newsletter",
        title: "Never miss a sale",
        subtitle: "Subscribe for early access to promotions.",
        body: "Subscribe",
        active: true,
      },
    ],
  },
  {
    id: "story",
    name: "Story / About",
    desc: "Tell your brand story with image and text blocks.",
    blocks: [
      {
        type: "hero",
        title: "Our story",
        subtitle: "A brand built on craftsmanship and care.",
        link_url: "/shop",
        link_label: "Browse the range",
        active: true,
      },
      {
        type: "image_text",
        title: "Made with care",
        subtitle: "Every piece is crafted with attention to detail.",
        body: "We work closely with our makers to ensure quality in every step of the process.",
        active: true,
      },
      {
        type: "text",
        title: "Why shop with us",
        body: "Fast delivery across the country, easy returns, and support that actually answers.",
        active: true,
      },
      {
        type: "newsletter",
        title: "Join the journey",
        subtitle: "Updates on new drops and behind-the-scenes.",
        body: "Subscribe",
        active: true,
      },
    ],
  },
  {
    id: "landing",
    name: "Landing",
    desc: "High-converting layout for a campaign landing page.",
    blocks: [
      {
        type: "hero",
        title: "New collection is here",
        subtitle: "Explore the latest drop — arrive early for the best picks.",
        link_url: "/shop",
        link_label: "Explore now",
        active: true,
      },
      {
        type: "image_text",
        title: "Designed for everyday",
        subtitle: "Comfortable, versatile and made to move with you.",
        body: "From morning commutes to weekend plans, these pieces fit right in.",
        active: true,
      },
      {
        type: "banner",
        title: "First order? Get 10% off",
        subtitle: "Use code WELCOME10 at checkout.",
        link_url: "/shop",
        link_label: "Start shopping",
        active: true,
      },
      {
        type: "featured_products",
        title: "Shop the new arrivals",
        subtitle: "Fresh in — don't wait.",
        active: true,
      },
      {
        type: "newsletter",
        title: "Get the inside scoop",
        subtitle: "Early access to drops and exclusive perks.",
        body: "Subscribe",
        active: true,
      },
    ],
  },
];

type Block = Omit<HomepageSection, "created_at" | "updated_at" | "tenant_id"> & {
  localId: string;
};

function makeBlock(type: string, index: number): Block {
  return {
    localId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `new-${index}`,
    id: "",
    section_type: type,
    title: "",
    subtitle: "",
    body: "",
    image_url: "",
    link_url: "",
    link_label: "",
    sort_order: index,
    active: true,
    settings: {},
  };
}

function toSignature(sections: HomepageSection[]): string {
  return JSON.stringify(
    sections.map((s) => [
      s.id,
      s.sort_order,
      s.section_type,
      s.title,
      s.subtitle,
      s.body,
      s.image_url,
      s.link_url,
      s.link_label,
      s.active,
    ])
  );
}

export function HomepageEditor({ sections }: { sections: HomepageSection[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(() => sections.map(mapSection));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingPalette, setDraggingPalette] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const syncedSig = useRef<string>(toSignature(sections));

  function mapSection(s: HomepageSection): Block {
    return {
      ...s,
      image_url: s.image_url ?? "",
      link_url: s.link_url ?? "",
      link_label: s.link_label ?? "",
      localId: s.id,
    };
  }

  function resetFromServer() {
    const next = sections.map(mapSection);
    setBlocks(next);
    setSelectedId(null);
    setNotice("Changes discarded.");
    setError(null);
    syncedSig.current = toSignature(sections);
  }

  useEffect(() => {
    const sig = toSignature(sections);
    if (sig !== syncedSig.current) {
      setBlocks(sections.map(mapSection));
      setSelectedId(null);
      setNotice(null);
      syncedSig.current = sig;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const selected = useMemo(
    () => blocks.find((b) => b.localId === selectedId) ?? null,
    [blocks, selectedId]
  );

  const hiddenCount = blocks.filter((b) => !b.active).length;

  function updateBlock(localId: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.localId === localId ? { ...b, ...patch } : b)));
    setNotice(null);
    setError(null);
  }

  function moveBlock(from: string, toIndex: number) {
    setBlocks((prev) => {
      const arr = [...prev];
      const fromIndex = arr.findIndex((b) => b.localId === from);
      if (fromIndex < 0) return prev;
      const [moved] = arr.splice(fromIndex, 1);
      const target = Math.max(0, Math.min(toIndex, arr.length));
      arr.splice(target, 0, moved);
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
  }

  function addPaletteBlock(type: string, index: number) {
    setBlocks((prev) => {
      const arr = [...prev];
      const nb = makeBlock(type, index);
      arr.splice(Math.max(0, Math.min(index, arr.length)), 0, nb);
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
    setNotice(null);
    setError(null);
  }

  function materializeTemplate(t: Template, startIndex: number): Block[] {
    return t.blocks.map((tb, i) => ({
      localId:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `tpl-${startIndex}-${i}`,
      id: "",
      section_type: tb.type,
      title: tb.title ?? "",
      subtitle: tb.subtitle ?? "",
      body: tb.body ?? "",
      image_url: tb.image_url ?? "",
      link_url: tb.link_url ?? "",
      link_label: tb.link_label ?? "",
      sort_order: startIndex + i,
      active: tb.active,
      settings: {},
    }));
  }

  function requestTemplate(t: Template) {
    if (blocks.length > 0) {
      setPendingTemplate(t);
      return;
    }
    applyTemplate(t, "replace");
  }

  function applyTemplate(t: Template, mode: "replace" | "append") {
    setBlocks((prev) => {
      const from = materializeTemplate(t, mode === "replace" ? 0 : prev.length);
      const base = mode === "replace" ? [] : prev;
      return [...base, ...from].map((b, i) => ({ ...b, sort_order: i }));
    });
    setSelectedId(null);
    setPendingTemplate(null);
    setTemplatesOpen(false);
    setNotice(
      mode === "replace"
        ? `Loaded the “${t.name}” template.`
        : `Added the “${t.name}” template to your page.`
    );
    setError(null);
  }

  function removeBlock(localId: string) {
    setBlocks((prev) => prev.filter((b) => b.localId !== localId).map((b, i) => ({ ...b, sort_order: i })));
    if (selectedId === localId) setSelectedId(null);
    setNotice(null);
    setError(null);
  }

  function moveBy(localId: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((b) => b.localId === localId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      const [moved] = arr.splice(idx, 1);
      arr.splice(target, 0, moved);
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
  }

  function duplicateBlock(localId: string) {
    setBlocks((prev) => {
      const src = prev.find((b) => b.localId === localId);
      if (!src) return prev;
      const idx = prev.findIndex((b) => b.localId === localId);
      const copy: Block = {
        ...src,
        localId:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `dup-${Date.now()}`,
        id: "",
        title: src.title ?? "",
        subtitle: src.subtitle ?? "",
        body: src.body ?? "",
        image_url: src.image_url ?? "",
        link_url: src.link_url ?? "",
        link_label: src.link_label ?? "",
      };
      const arr = [...prev];
      arr.splice(idx + 1, 0, copy);
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
    setNotice(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const payload = buildPayload(b, i);
        const res = b.id
          ? await updateSection(b.id, payload)
          : await createSection({}, payload);
        if (res.error) throw new Error(res.error);
      }

      const presentIds = new Set(blocks.filter((b) => b.id).map((b) => b.id));
      for (const s of sections) {
        if (!presentIds.has(s.id)) await deleteSection(s.id);
      }

      router.refresh();
      setNotice("Changes saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes. Try again.");
    }
    setSaving(false);
  }

  function buildPayload(b: Block, index: number): FormData {
    const payload = new FormData();
    payload.set("sectionType", b.section_type);
    payload.set("title", b.title ?? "");
    payload.set("subtitle", b.subtitle ?? "");
    payload.set("body", b.body ?? "");
    payload.set("imageUrl", b.image_url ?? "");
    payload.set("linkUrl", b.link_url ?? "");
    payload.set("linkLabel", b.link_label ?? "");
    payload.set("sortOrder", String(index));
    return payload;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr_320px]">
      <aside className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-sm font-semibold text-charcoal">Add blocks</h3>
            <p className="mt-0.5 text-xs text-muted">Drag onto the page</p>
          </div>
          <button
            onClick={() => setTemplatesOpen(true)}
            className="rounded-lg border border-pine/30 bg-pine/[0.05] px-2.5 py-1.5 text-xs font-semibold text-pine transition hover:bg-pine/10"
          >
            Templates
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {PALETTE.map((p) => (
            <div
              key={p.type}
              draggable
              onDragStart={(e) => {
                setDraggingPalette(p.type);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onDragEnd={() => setDraggingPalette(null)}
              className="cursor-grab rounded-lg border border-charcoal/10 bg-white p-3 transition hover:border-pine/40 hover:bg-pine/[0.03] active:cursor-grabbing"
            >
              <p className="text-sm font-medium text-charcoal">{p.label}</p>
              <p className="mt-0.5 text-xs text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </aside>

      <main>
        <div
          ref={canvasRef}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = draggingPalette ? "copy" : "move";
            if (draggingPalette && insertIndex === null) setInsertIndex(blocks.length);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingPalette) {
              addPaletteBlock(draggingPalette, insertIndex ?? blocks.length);
              setDraggingPalette(null);
              setInsertIndex(null);
            }
          }}
          className="rounded-xl border border-dashed border-charcoal/20 bg-cream/30 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-charcoal">Live preview</p>
            {hiddenCount > 0 && (
              <span className="rounded-md bg-charcoal/5 px-2 py-1 text-xs text-muted">
                {hiddenCount} hidden
              </span>
            )}
          </div>

          {blocks.length === 0 && (
            <div className="rounded-lg border border-dashed border-charcoal/15 bg-white p-8 text-center">
              <p className="font-heading text-base font-semibold text-charcoal">
                Your homepage is empty
              </p>
              <p className="mt-1 text-sm text-muted">
                Drag a block from the left, or add one with a quick pick below.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {PALETTE.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => addPaletteBlock(p.type, blocks.length)}
                    className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-xs font-medium text-charcoal-soft transition hover:border-pine/40 hover:bg-pine/[0.03]"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {blocks.map((b, i) => (
              <div key={b.localId}>
                <div
                  className="mb-3 h-1 rounded transition-colors"
                  style={{ backgroundColor: insertIndex === i ? "#d4a017" : "transparent" }}
                />
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", b.localId);
                  }}
                  onClick={() => setSelectedId(b.localId)}
                  onDragOver={(e) => { e.preventDefault(); setInsertIndex(i); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData("text/plain");
                    if (fromId && fromId !== b.localId) moveBlock(fromId, i);
                    setInsertIndex(null);
                  }}
                  className={`cursor-grab rounded-xl border bg-white shadow-sm transition active:cursor-grabbing ${
                    selectedId === b.localId
                      ? "border-gold ring-2 ring-gold/30"
                      : "border-charcoal/10"
                  } ${b.active ? "" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-2 border-b border-charcoal/5 bg-cream/40 px-3 py-2">
                    <span className="cursor-grab text-muted" title="Drag to reorder" aria-hidden>⋮⋮</span>
                    <span className="rounded-md bg-charcoal/5 px-2 py-0.5 text-[11px] font-medium text-charcoal-soft">
                      {TYPE_LABELS[b.section_type] ?? b.section_type}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBy(b.localId, "up"); }}
                        disabled={i === 0}
                        title="Move up"
                        aria-label="Move up"
                        className="rounded border border-charcoal/10 px-1.5 py-0.5 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBy(b.localId, "down"); }}
                        disabled={i === blocks.length - 1}
                        title="Move down"
                        aria-label="Move down"
                        className="rounded border border-charcoal/10 px-1.5 py-0.5 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateBlock(b.localId); }}
                        title="Duplicate block"
                        aria-label="Duplicate block"
                        className="rounded border border-charcoal/10 px-2 py-0.5 text-xs text-charcoal-soft transition hover:bg-white"
                      >
                        ⧉
                      </button>
                    </div>
                    <span className="flex items-center gap-2 text-[11px] text-muted">
                      {b.active ? (
                        <span className="text-pine">Visible</span>
                      ) : (
                        <span>Hidden</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(b.localId);
                        }}
                        className="rounded-md px-1.5 py-0.5 font-medium text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                  <div className="pointer-events-none px-3 py-2">
                    <SectionPreview section={b} />
                  </div>
                </div>
              </div>
            ))}
            <div
              className="h-1 rounded transition-colors"
              style={{ backgroundColor: insertIndex === blocks.length ? "#d4a017" : "transparent" }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-pine">{notice}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetFromServer}
              className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal-soft transition hover:bg-cream"
            >
              Discard changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white transition hover:bg-pine-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </main>

      <aside className="rounded-xl border border-white/70 bg-white p-5 shadow-sm">
        {!selected ? (
          <div className="text-center">
            <p className="text-sm font-medium text-charcoal">Inspector</p>
            <p className="mt-2 text-xs text-muted">
              Select a block on the page to edit its content.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Editing block
                </p>
                <p className="font-heading text-base font-semibold text-charcoal">
                  {TYPE_LABELS[selected.section_type] ?? "Block"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveBy(selected.localId, "up")}
                  disabled={selected.sort_order === 0}
                  title="Move up"
                  aria-label="Move up"
                  className="rounded border border-charcoal/10 px-2 py-1 text-xs text-charcoal-soft transition hover:bg-cream disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveBy(selected.localId, "down")}
                  disabled={selected.sort_order === blocks.length - 1}
                  title="Move down"
                  aria-label="Move down"
                  className="rounded border border-charcoal/10 px-2 py-1 text-xs text-charcoal-soft transition hover:bg-cream disabled:opacity-30"
                >
                  ↓
                </button>
                <span className="rounded-md bg-charcoal/5 px-2 py-1 text-[11px] text-muted">
                  #{selected.sort_order + 1}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <Field label="Title">
                <Input
                  value={selected.title ?? ""}
                  onChange={(v) => updateBlock(selected.localId, { title: v })}
                  placeholder="Section heading"
                  maxLength={200}
                />
              </Field>
              <Field label="Subtitle">
                <Input
                  value={selected.subtitle ?? ""}
                  onChange={(v) => updateBlock(selected.localId, { subtitle: v })}
                  placeholder="Short description"
                  maxLength={500}
                />
              </Field>
              {["text", "image_text", "newsletter"].includes(selected.section_type) && (
                <Field label="Body text">
                  <Textarea
                    value={selected.body ?? ""}
                    onChange={(v) => updateBlock(selected.localId, { body: v })}
                    placeholder="Content for this section"
                  />
                </Field>
              )}
              {["hero", "banner", "image_text"].includes(selected.section_type) && (
                <Field label="Image URL">
                  <Input
                    value={selected.image_url ?? ""}
                    onChange={(v) => updateBlock(selected.localId, { image_url: v })}
                    placeholder="https://..."
                    type="url"
                  />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Link URL">
                  <Input
                    value={selected.link_url ?? ""}
                    onChange={(v) => updateBlock(selected.localId, { link_url: v })}
                    placeholder="/shop"
                  />
                </Field>
                <Field label="Link label">
                  <Input
                    value={selected.link_label ?? ""}
                    onChange={(v) => updateBlock(selected.localId, { link_label: v })}
                    placeholder="Shop now"
                    maxLength={100}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-charcoal/10 px-3 py-2.5">
                <span className="text-sm text-charcoal-soft">Visibility</span>
                <button
                  onClick={() => updateBlock(selected.localId, { active: !selected.active })}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    selected.active
                      ? "bg-pine/10 text-pine hover:bg-pine/20"
                      : "bg-charcoal/5 text-muted hover:bg-charcoal/10"
                  }`}
                >
                  {selected.active ? "Visible" : "Hidden"}
                </button>
              </div>

              <button
                onClick={() => duplicateBlock(selected.localId)}
                className="w-full rounded-lg border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal-soft transition hover:bg-cream"
              >
                Duplicate block
              </button>

              <button
                onClick={() => removeBlock(selected.localId)}
                className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete block
              </button>
            </div>
          </div>
        )}
      </aside>

      {templatesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4"
          onClick={() => setTemplatesOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold text-charcoal">
                  Choose a template
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  A quick starting point you can edit after applying.
                </p>
              </div>
              <button
                onClick={() => setTemplatesOpen(false)}
                className="rounded-lg p-2 text-muted transition hover:bg-cream hover:text-charcoal"
                aria-label="Close templates"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col rounded-xl border border-charcoal/10 bg-cream/30 p-4"
                >
                  <div className="rounded-lg border border-charcoal/10 bg-white p-3">
                    {t.blocks.slice(0, 3).map((tb, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted">
                          {TYPE_LABELS[tb.type] ?? tb.type}
                        </span>
                        {tb.title ? (
                          <p className="truncate text-[11px] font-medium text-charcoal">
                            {tb.title}
                          </p>
                        ) : (
                          <div className="h-2.5 w-3/4 rounded bg-charcoal/10" />
                        )}
                      </div>
                    ))}
                    {t.blocks.length > 3 && (
                      <p className="mt-1 text-[10px] text-muted">
                        +{t.blocks.length - 3} more blocks
                      </p>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-charcoal">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => requestTemplate(t)}
                    className="mt-3 w-full rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine-dark"
                  >
                    Use template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-heading text-lg font-semibold text-charcoal">
              Apply “{pendingTemplate.name}”?
            </h3>
            <p className="mt-2 text-sm text-muted">
              You already have sections on this page. Replace them with the
              template, or add it below your current sections.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPendingTemplate(null);
                  setTemplatesOpen(true);
                }}
                className="rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft transition hover:bg-cream"
              >
                Cancel
              </button>
              <button
                onClick={() => applyTemplate(pendingTemplate, "append")}
                className="rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pine-dark"
              >
                Add to existing
              </button>
            </div>
            <button
              onClick={() => applyTemplate(pendingTemplate, "replace")}
              className="mt-3 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Replace current sections
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-charcoal-soft">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={4}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
    />
  );
}
