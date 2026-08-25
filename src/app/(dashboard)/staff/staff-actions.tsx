"use client";

import { removeStaff, updateStaffRole } from "./actions";

export function StaffActions({
  id,
  role,
}: {
  id: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => updateStaffRole(id, e.target.value as "manager" | "staff")}
        className="rounded-md border border-charcoal/15 px-2 py-1.5 text-xs font-medium text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      >
        <option value="staff">Staff</option>
        <option value="manager">Manager</option>
      </select>
      <button
        onClick={() => {
          if (window.confirm("Remove this staff member?")) {
            removeStaff(id);
          }
        }}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}
