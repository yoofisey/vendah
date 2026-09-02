"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const sectionSchema = z.object({
  sectionType: z.enum(["hero", "featured_products", "banner", "text", "image_text", "newsletter"]),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().max(500).optional().nullable(),
  linkLabel: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type SectionActionState = { error?: string; success?: boolean };

export async function createSection(
  _prev: SectionActionState,
  formData: FormData
): Promise<SectionActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = sectionSchema.safeParse({
    sectionType: String(formData.get("sectionType") ?? "text"),
    title: String(formData.get("title") ?? "").trim() || null,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
    linkLabel: String(formData.get("linkLabel") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  if (!parsed.success) return { error: "Please check the details you entered." };

  const admin = createAdminClient();
  const { error } = await admin.from("homepage_sections").insert({
    tenant_id: tenant.id,
    section_type: parsed.data.sectionType,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    body: parsed.data.body,
    image_url: parsed.data.imageUrl,
    link_url: parsed.data.linkUrl,
    link_label: parsed.data.linkLabel,
    sort_order: parsed.data.sortOrder,
  });

  if (error) return { error: "Couldn't create section. Try again." };

  revalidatePath("/homepage");
  return { success: true };
}

export async function updateSection(
  id: string,
  formData: FormData
): Promise<SectionActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = sectionSchema.safeParse({
    sectionType: String(formData.get("sectionType") ?? "text"),
    title: String(formData.get("title") ?? "").trim() || null,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
    linkLabel: String(formData.get("linkLabel") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  if (!parsed.success) return { error: "Please check the details you entered." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("homepage_sections")
    .update({
      section_type: parsed.data.sectionType,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      body: parsed.data.body,
      image_url: parsed.data.imageUrl,
      link_url: parsed.data.linkUrl,
      link_label: parsed.data.linkLabel,
      sort_order: parsed.data.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { error: "Couldn't update section. Try again." };

  revalidatePath("/homepage");
  return { success: true };
}

export async function deleteSection(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("homepage_sections").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/homepage");
}

export async function reorderSections(ids: string[]): Promise<{ error?: string }> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const admin = createAdminClient();
  for (let i = 0; i < ids.length; i++) {
    await admin
      .from("homepage_sections")
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq("id", ids[i])
      .eq("tenant_id", tenant.id);
  }

  revalidatePath("/homepage");
  return {};
}

export async function toggleSectionActive(id: string, active: boolean): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("homepage_sections")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/homepage");
}
