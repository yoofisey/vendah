"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  type AddressActionState,
} from "./actions";

export type AddressRow = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  isDefault: boolean;
};

const initialState: AddressActionState = {};

const inputClasses =
  "mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

export function AddressBook({
  subdomain,
  addresses,
  defaultFullName,
}: {
  subdomain: string;
  addresses: AddressRow[];
  defaultFullName: string;
}) {
  const [editing, setEditing] = useState<AddressRow | "new" | null>(null);
  const [state, action, pending] = useActionState(saveAddress, initialState);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) setEditing(null);
  }, [state]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    setBusyId(id);
    try {
      await deleteAddress(subdomain, id);
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    try {
      await setDefaultAddress(subdomain, id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold text-charcoal">
          Saved addresses
        </h2>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
          >
            Add new address
          </button>
        )}
      </div>

      {editing !== null && (
        <form
          key={editing === "new" ? "new" : editing.id}
          action={action}
          className="mt-5 space-y-4 rounded-xl border border-charcoal/10 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="subdomain" value={subdomain} />
          {editing !== "new" && (
            <input type="hidden" name="addressId" value={editing.id} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="label"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Label
              </label>
              <select
                id="label"
                name="label"
                defaultValue={editing === "new" ? "Home" : editing.label}
                className={inputClasses}
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                minLength={2}
                defaultValue={
                  editing === "new" ? defaultFullName : editing.fullName
                }
                placeholder="Ama Mensah"
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={editing === "new" ? "" : editing.phone}
                placeholder="+233 24 000 0000"
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-charcoal-soft"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                required
                minLength={2}
                defaultValue={editing === "new" ? "" : editing.city}
                placeholder="Accra"
                className={inputClasses}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="addressLine1"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Address line 1
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                required
                minLength={3}
                defaultValue={editing === "new" ? "" : editing.addressLine1}
                placeholder="Street address or P.O. box"
                className={inputClasses}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="addressLine2"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Address line 2
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                defaultValue={editing === "new" ? "" : editing.addressLine2}
                placeholder="Apartment, suite, landmark (optional)"
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Region
              </label>
              <input
                id="region"
                name="region"
                defaultValue={editing === "new" ? "" : editing.region}
                placeholder="Greater Accra (optional)"
                className={inputClasses}
              />
            </div>
            {editing !== "new" && !editing.isDefault && (
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-charcoal-soft">
                  <input
                    type="checkbox"
                    name="isDefault"
                    value="true"
                    className="h-4 w-4 rounded border-charcoal/30 accent-pine"
                  />
                  Set as default
                </label>
              </div>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-charcoal/15 px-5 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:bg-cream"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editing === null ? (
        <div className="mt-6 rounded-xl border border-dashed border-charcoal/20 bg-white p-12 text-center">
          <p className="text-sm font-medium text-charcoal">
            No saved addresses yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Add a delivery address to check out faster next time.
          </p>
        </div>
      ) : (
        addresses.length > 0 && (
          <ul className="mt-5 space-y-4">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="rounded-xl border border-charcoal/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-charcoal-soft">
                        {address.label}
                      </span>
                      {address.isDefault && (
                        <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-xs font-semibold text-pine">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-charcoal">
                      {address.fullName}
                      {address.phone ? ` · ${address.phone}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {[address.addressLine1, address.addressLine2]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sm text-muted">
                      {[address.city, address.region].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={busyId === address.id}
                        className="rounded-lg border border-pine/30 px-3 py-1.5 text-xs font-semibold text-pine transition duration-150 hover:bg-pine hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(address)}
                      disabled={busyId === address.id}
                      className="rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      disabled={busyId === address.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition duration-150 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
