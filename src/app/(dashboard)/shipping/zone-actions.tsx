"use client";

import { useState } from "react";
import { deleteZone, toggleZoneActive } from "./actions";
import { ZoneForm } from "./zone-form";

export function ZoneActions({
  id,
  active,
  name,
  feeMinor,
  freeAboveMinor,
  sortOrder,
}: {
  id: string;
  active: boolean;
  name: string;
  feeMinor: number;
  freeAboveMinor: number | null;
  sortOrder: number;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
        >
          Edit
        </button>
        <button
          onClick={() => toggleZoneActive(id, !active)}
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
            if (window.confirm(`Delete "${name}"?`)) {
              deleteZone(id);
            }
          }}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {editing && (
        <ZoneForm
          edit={{
            id,
            name,
            feeMinor,
            freeAboveMinor,
            sortOrder,
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
