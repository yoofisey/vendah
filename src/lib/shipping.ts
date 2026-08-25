import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ShippingZone = {
  id: string;
  tenant_id: string;
  name: string;
  fee_minor: number;
  free_above_minor: number | null;
  active: boolean;
  sort_order: number;
};

export const getActiveShippingZones = cache(
  async (tenantId: string): Promise<ShippingZone[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("shipping_zones")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return (data as ShippingZone[]) ?? [];
  }
);
