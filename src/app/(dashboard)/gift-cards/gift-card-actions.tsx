"use client";

import { deleteGiftCard, toggleGiftCardActive } from "./actions";

export function GiftCardActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const active = status === "active";
  return (
    <div className="flex items-center gap-2">
      {status === "disabled" && (
        <button
          onClick={() => toggleGiftCardActive(id, true)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-pine transition duration-150 hover:bg-pine/10"
        >
          Enable
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => toggleGiftCardActive(id, false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted transition duration-150 hover:bg-charcoal/10"
        >
          Disable
        </button>
      )}
      <button
        onClick={() => {
          if (window.confirm("Delete this gift card?")) {
            deleteGiftCard(id);
          }
        }}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}