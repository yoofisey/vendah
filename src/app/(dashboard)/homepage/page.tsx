import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { getAllHomepageSections } from "@/lib/homepage-sections";
import { HomepageEditor } from "./homepage-editor";

export default async function HomepageSectionsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const sections = await getAllHomepageSections(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Homepage Editor
        </h1>
        <p className="mt-2 text-sm text-muted">
          Build and reorder the sections on your store&apos;s homepage. Drag
          blocks from the palette onto the page, then edit them in the
          inspector.
        </p>
      </div>

      <HomepageEditor sections={sections} />
    </div>
  );
}
