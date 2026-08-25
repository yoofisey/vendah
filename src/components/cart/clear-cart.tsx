"use client";

import { useEffect } from "react";
import { cartKey } from "@/lib/cart";

export function ClearCart({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    localStorage.removeItem(cartKey(tenantId));
  }, [tenantId]);
  return null;
}
