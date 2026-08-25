"use client";

import { useState } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";

export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-600" /> Copied
        </>
      ) : (
        <>
          <ClipboardIcon className="h-3.5 w-3.5" /> Copy link
        </>
      )}
    </button>
  );
}
