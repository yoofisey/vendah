import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type HomepageSection = {
  id: string;
  tenant_id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  sort_order: number;
  active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function getHomepageSections(
  tenantId: string
): Promise<HomepageSection[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("homepage_sections")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []) as HomepageSection[];
}

export async function getAllHomepageSections(
  tenantId: string
): Promise<HomepageSection[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("homepage_sections")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  return (data ?? []) as HomepageSection[];
}
