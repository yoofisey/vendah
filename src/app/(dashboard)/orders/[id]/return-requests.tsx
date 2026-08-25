"use client";

import { resolveReturnRequest } from "../actions";

type ReturnRequest = {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  refund_minor: number | null;
  created_at: string;
  resolved_at: string | null;
};

function ResolveButton({
  requestId,
  approved,
}: {
  requestId: string;
  approved: boolean;
}) {
  async function handleResolve() {
    let refundMinor = 0;
    if (approved) {
      const input = prompt(`Refund amount in pesewas (0 = no refund):`);
      if (input === null) return;
      refundMinor = Number(input) || 0;
    }
    await resolveReturnRequest(requestId, approved, refundMinor);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleResolve}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition duration-150 ${
        approved
          ? "bg-pine text-white hover:bg-pine-dark"
          : "border border-red-200 text-red-600 hover:bg-red-50"
      }`}
    >
      {approved ? "Approve" : "Reject"}
    </button>
  );
}

export function ReturnRequests({
  requests,
}: {
  requests: ReturnRequest[];
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Return requests
      </h2>
      <ul className="mt-3 space-y-4">
        {requests.map((req) => (
          <li
            key={req.id}
            className="rounded-lg border border-charcoal/10 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-charcoal">{req.reason}</p>
                <p className="mt-1 text-xs text-muted">
                  Requested{" "}
                  {new Date(req.created_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                  {req.resolved_at && (
                    <>
                      {" · Resolved "}
                      {new Date(req.resolved_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </>
                  )}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  req.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : req.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {req.status}
              </span>
            </div>
            {req.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <ResolveButton
                  requestId={req.id}
                  approved={true}
                />
                <ResolveButton
                  requestId={req.id}
                  approved={false}
                />
              </div>
            )}
            {req.refund_minor != null && req.refund_minor > 0 && (
              <p className="mt-2 text-xs font-medium text-pine">
                Refunded: GH₵ {(req.refund_minor / 100).toFixed(2)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
