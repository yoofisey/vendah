import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { getAllHomepageSections } from "@/lib/homepage-sections";
import { SectionForm } from "./section-form";
import { SectionActions } from "./section-actions";

export default async function HomepageSectionsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const sections = await getAllHomepageSections(tenant.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Homepage Sections
          </h1>
          <p className="mt-2 text-sm text-muted">
            Customise what appears on your store&apos;s homepage. Drag to reorder, toggle visibility, or add new sections.
          </p>
        </div>
        <SectionForm />
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No sections yet. Add your first homepage section to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center justify-between gap-4 rounded-xl border bg-white px-6 py-4 shadow-sm transition duration-150 ${
                section.active ? "border-charcoal/10" : "border-charcoal/5 opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cream text-xs font-bold text-charcoal">
                    {section.sort_order}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {section.title || "(No title)"}
                    </p>
                    {section.subtitle && (
                      <p className="truncate text-xs text-muted">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <SectionActions
                id={section.id}
                active={section.active}
                sectionType={section.section_type}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
