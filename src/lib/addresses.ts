import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type CustomerAddress = {
  id: string;
  tenant_id: string;
  customer_email: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  is_default: boolean;
  created_at: string;
};

export type CustomerAddressInput = {
  id?: string;
  label?: string;
  fullName: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  isDefault?: boolean;
};

export type MutationResult = { error?: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toRow(address: CustomerAddressInput) {
  return {
    label: address.label?.trim() || "Home",
    full_name: address.fullName.trim(),
    phone: address.phone?.trim() || null,
    address_line1: address.addressLine1.trim(),
    address_line2: address.addressLine2?.trim() || null,
    city: address.city.trim(),
    region: address.region?.trim() || null,
  };
}

async function clearOtherDefaults(
  admin: SupabaseClient,
  tenantId: string,
  customerEmail: string,
  keepId: string
): Promise<void> {
  await admin
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("tenant_id", tenantId)
    .eq("customer_email", customerEmail)
    .neq("id", keepId);
}

export async function getCustomerAddresses(
  tenantId: string,
  customerEmail: string
): Promise<CustomerAddress[]> {
  if (!UUID_PATTERN.test(tenantId)) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("customer_addresses")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("customer_email", normalizeEmail(customerEmail))
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as CustomerAddress[]) ?? [];
}

export async function getCustomerAddressById(
  tenantId: string,
  addressId: string
): Promise<CustomerAddress | null> {
  if (!UUID_PATTERN.test(tenantId) || !UUID_PATTERN.test(addressId)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("customer_addresses")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", addressId)
    .maybeSingle();
  return (data as CustomerAddress) ?? null;
}

export async function saveCustomerAddress(
  tenantId: string,
  customerEmail: string,
  address: CustomerAddressInput
): Promise<MutationResult> {
  if (!UUID_PATTERN.test(tenantId)) return { error: "Invalid store." };
  const admin = createAdminClient();
  const email = normalizeEmail(customerEmail);
  const row = toRow(address);

  if (address.id) {
    if (!UUID_PATTERN.test(address.id)) return { error: "Invalid address." };
    const { error } = await admin
      .from("customer_addresses")
      .update(row)
      .eq("id", address.id)
      .eq("tenant_id", tenantId)
      .eq("customer_email", email);
    if (error) return { error: "Couldn't save the address. Try again." };
    if (address.isDefault) {
      await clearOtherDefaults(admin, tenantId, email, address.id);
    }
    return {};
  }

  let isDefault = address.isDefault ?? false;
  if (!isDefault) {
    const { count } = await admin
      .from("customer_addresses")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("customer_email", email);
    isDefault = (count ?? 0) === 0;
  }

  const { data: inserted, error } = await admin
    .from("customer_addresses")
    .insert({
      tenant_id: tenantId,
      customer_email: email,
      ...row,
      is_default: isDefault,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return { error: "Couldn't save the address. Try again." };
  }
  if (isDefault) {
    await clearOtherDefaults(admin, tenantId, email, inserted.id);
  }
  return {};
}

export async function deleteCustomerAddress(
  tenantId: string,
  addressId: string
): Promise<MutationResult> {
  if (!UUID_PATTERN.test(tenantId) || !UUID_PATTERN.test(addressId)) {
    return { error: "Invalid address." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("tenant_id", tenantId);
  if (error) return { error: "Couldn't delete the address. Try again." };
  return {};
}

export async function setDefaultAddress(
  tenantId: string,
  customerEmail: string,
  addressId: string
): Promise<MutationResult> {
  if (!UUID_PATTERN.test(tenantId) || !UUID_PATTERN.test(addressId)) {
    return { error: "Invalid address." };
  }
  const admin = createAdminClient();
  const email = normalizeEmail(customerEmail);
  const { data: address } = await admin
    .from("customer_addresses")
    .select("id")
    .eq("id", addressId)
    .eq("tenant_id", tenantId)
    .eq("customer_email", email)
    .maybeSingle();
  if (!address) return { error: "Address not found." };

  await clearOtherDefaults(admin, tenantId, email, address.id);
  const { error } = await admin
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", address.id);
  if (error) {
    return { error: "Couldn't set the default address. Try again." };
  }
  return {};
}
