import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type TaxRate = {
  id: string;
  tenant_id: string;
  name: string;
  rate_pct: number;
  applies_to: string;
  active: boolean;
};

export const getActiveTaxRates = cache(
  async (tenantId: string): Promise<TaxRate[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tax_rates")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true);
    return (data as TaxRate[]) ?? [];
  }
);
