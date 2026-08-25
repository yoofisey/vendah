"use client";

import { useTransition } from "react";
import { exportProducts } from "./actions";

export function ExportButton() {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const { csv } = await exportProducts();
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={pending}
      className="rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Generating CSV…" : "Download CSV"}
    </button>
  );
}
