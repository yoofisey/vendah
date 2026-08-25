"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteStaffSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["manager", "staff"]),
});

export type StaffActionState = { error?: string; success?: boolean };

export async function inviteStaff(
  _prev: StaffActionState,
  formData: FormData
): Promise<StaffActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = inviteStaffSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "staff"),
  });

  if (!parsed.success) return { error: "Please check the details you entered." };

  const admin = createAdminClient();

  const invitedByUser = await requireUser();

  const { data: authUser, error: authError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { role: parsed.data.role, tenant_id: tenant.id },
    }
  );

  if (authError) {
    if (authError.message?.includes("already")) {
      return { error: "A user with that email already exists." };
    }
    return { error: "Couldn't invite user. Try again." };
  }

  const { error } = await admin.from("staff_members").insert({
    tenant_id: tenant.id,
    user_id: authUser.user.id,
    role: parsed.data.role,
    invited_by: invitedByUser?.id ?? null,
  });

  if (error) {
    if (error.code === "23505") return { error: "That user is already a staff member." };
    return { error: "Couldn't add staff member. Try again." };
  }

  revalidatePath("/staff");
  return { success: true };
}

export async function updateStaffRole(
  id: string,
  role: "manager" | "staff"
): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("staff_members")
    .update({ role })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/staff");
}

export async function removeStaff(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("staff_members").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/staff");
}
