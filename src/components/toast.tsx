"use client";

import { useEffect, type ReactNode } from "react";
import { useSyncExternalStore } from "react";
import {
  CheckCircleIcon,
  HeartIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";

type ToastKind = "wishlist" | "cart" | "check" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): Toast[] {
  return toasts;
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function notify({
  kind,
  title,
  description,
}: Omit<Toast, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, kind, title, description }];
  emit();
}

const KIND_CARD: Record<ToastKind, { icon: ReactNode; chip: string }> = {
  wishlist: {
    icon: <HeartIcon className="h-5 w-5 text-rose-400" />,
    chip: "bg-rose-500/20",
  },
  cart: {
    icon: <ShoppingBagIcon className="h-5 w-5 text-gold" />,
    chip: "bg-gold/20",
  },
  check: {
    icon: <CheckCircleIcon className="h-5 w-5 text-emerald-400" />,
    chip: "bg-emerald-500/20",
  },
  info: {
    icon: <InformationCircleIcon className="h-5 w-5 text-sky-400" />,
    chip: "bg-sky-500/20",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), 2600);
    return () => window.clearTimeout(id);
  }, [toast.id]);

  const { icon, chip } = KIND_CARD[toast.kind];

  return (
    <div
      role="status"
      className="animate-sheet-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/15 bg-charcoal/90 px-4 py-3 text-white shadow-2xl backdrop-blur-md"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${chip}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">
          {toast.title}
        </span>
        {toast.description && (
          <span className="block truncate text-xs text-white/60">
            {toast.description}
          </span>
        )}
      </span>
    </div>
  );
}

export function Toaster() {
  const list = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
      {list.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}