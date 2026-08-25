"use client";

import { deleteDiscountCode, toggleDiscountActive } from "./actions";

export function DiscountActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggleDiscountActive(id, !active)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition duration-150 ${
          active
            ? "bg-pine/10 text-pine hover:bg-pine/20"
            : "bg-charcoal/5 text-muted hover:bg-charcoal/10"
        }`}
      >
        {active ? "Disable" : "Enable"}
      </button>
      <button
        onClick={() => {
          if (window.confirm("Delete this discount code?")) {
            deleteDiscountCode(id);
          }
        }}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}
