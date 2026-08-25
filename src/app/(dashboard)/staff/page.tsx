import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffInviteForm } from "./staff-form";
import { StaffActions } from "./staff-actions";

const roleLabel: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export default async function StaffPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("staff_members")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const list = members ?? [];

  const userIds = list.map((m) => m.user_id).filter(Boolean);
  const admin = createAdminClient();

  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: usersList } = await admin.auth.admin.listUsers();
    for (const u of usersList?.users ?? []) {
      if (userIds.includes(u.id)) {
        emailMap[u.id] = u.email ?? "—";
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Staff Accounts
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage who has access to your store dashboard.
          </p>
        </div>
        <StaffInviteForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No staff members yet. Invite someone to help manage your store.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((m) => (
                  <tr
                    key={m.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {emailMap[m.user_id] ?? "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {roleLabel[m.role] ?? m.role}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <StaffActions id={m.id} role={m.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
