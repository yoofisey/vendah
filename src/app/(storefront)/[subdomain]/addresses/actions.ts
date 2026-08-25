"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import {
  deleteCustomerAddress,
  getCustomerAddressById,
  saveCustomerAddress,
  setDefaultAddress as setDefaultAddressInDb,
} from "@/lib/addresses";
import { getTenantBySubdomain } from "@/lib/storefront";

export type AddressActionState = { error?: string; success?: boolean };

const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  fullName: z.string().trim().min(2, "Enter the recipient's name.").max(120),
  phone: z.string().trim().max(30),
  addressLine1: z.string().trim().min(3, "Enter the street address.").max(200),
  addressLine2: z.string().trim().max(200),
  city: z.string().trim().min(2, "Enter the city.").max(100),
  region: z.string().trim().max(100),
});

export async function saveAddress(
  _prev: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const user = await getUser();
  if (!user?.email) {
    return { error: "Please sign in to manage your addresses." };
  }

  const tenant = await getTenantBySubdomain(
    String(formData.get("subdomain") ?? "").trim()
  );
  if (!tenant) return { error: "Store not found." };

  const parsed = addressSchema.safeParse({
    label: String(formData.get("label") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    city: String(formData.get("city") ?? ""),
    region: String(formData.get("region") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the address details.",
    };
  }

  const result = await saveCustomerAddress(tenant.id, user.email, {
    id: String(formData.get("addressId") ?? "").trim() || undefined,
    label: parsed.data.label,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone || null,
    addressLine1: parsed.data.addressLine1,
    addressLine2: parsed.data.addressLine2 || null,
    city: parsed.data.city,
    region: parsed.data.region || null,
    isDefault: String(formData.get("isDefault") ?? "") === "true",
  });
  if (result.error) return { error: result.error };

  revalidatePath("/[subdomain]/addresses", "page");
  return { success: true };
}

export async function deleteAddress(
  subdomain: string,
  addressId: string
): Promise<void> {
  const user = await getUser();
  if (!user?.email) return;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return;

  const address = await getCustomerAddressById(tenant.id, addressId);
  if (!address || address.customer_email !== user.email.trim().toLowerCase()) {
    return;
  }

  await deleteCustomerAddress(tenant.id, addressId);
  revalidatePath("/[subdomain]/addresses", "page");
}

export async function setDefaultAddress(
  subdomain: string,
  addressId: string
): Promise<void> {
  const user = await getUser();
  if (!user?.email) return;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return;

  await setDefaultAddressInDb(tenant.id, user.email, addressId);
  revalidatePath("/[subdomain]/addresses", "page");
}
