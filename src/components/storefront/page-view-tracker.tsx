"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export function PageViewTracker() {
  const hasFired = useRef(false);
  const params = useParams();
  const subdomain = params?.subdomain as string | undefined;

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    let visitorId = sessionStorage.getItem("vendah_vid");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      sessionStorage.setItem("vendah_vid", visitorId);
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        visitor_id: visitorId,
      }),
    }).catch(() => {});
  }, [subdomain]);

  return null;
}
