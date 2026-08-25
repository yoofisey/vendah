import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CampaignForm } from "./campaign-form";
import { CampaignActions } from "./campaign-actions";

export default async function MarketingPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const list = campaigns ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Email Marketing
          </h1>
          <p className="mt-2 text-sm text-muted">
            Send promotional emails to your customers. Recipients are people who have placed an order with their email address.
          </p>
        </div>
        <CampaignForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No campaigns yet. Create your first promotional email to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Recipients</th>
                  <th className="px-6 py-4">Sent at</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((c) => (
                  <tr
                    key={c.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {c.subject}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                          c.status === "sent"
                            ? "bg-pine/10 text-pine"
                            : c.status === "failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-charcoal/5 text-muted"
                        }`}
                      >
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {c.recipient_count}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {c.sent_at
                        ? new Date(c.sent_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <CampaignActions id={c.id} status={c.status} />
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
