import type { PlanId } from "@/lib/types";

export type Plan = {
  name: string;
  monthlyGhs: number;
  annualGhs: number;
  productLimit: number | null;
  salesFeePct: number;
  poweredByFooter: boolean;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    name: "Free",
    monthlyGhs: 0,
    annualGhs: 0,
    productLimit: 20,
    salesFeePct: 6,
    poweredByFooter: true,
    features: [
      "20 products",
      "Card & mobile money payments via Paystack",
      "Order tracking for your customers",
      "Powered by Venfii footer",
    ],
  },
  starter: {
    name: "Starter",
    monthlyGhs: 100,
    annualGhs: 1000,
    productLimit: 40,
    salesFeePct: 0,
    poweredByFooter: false,
    features: [
      "40 products",
      "0% sales commission",
      "No Venfii branding",
      "Your own subdomain storefront",
    ],
  },
  growth: {
    name: "Growth",
    monthlyGhs: 200,
    annualGhs: 2000,
    productLimit: 80,
    salesFeePct: 0,
    poweredByFooter: false,
    features: [
      "80 products",
      "0% sales commission",
      "No Venfii branding",
      "WhatsApp order sync",
      "Mobile money reconciliation",
    ],
  },
  industry: {
    name: "Industry",
    monthlyGhs: 400,
    annualGhs: 4000,
    productLimit: null,
    salesFeePct: 0,
    poweredByFooter: false,
    features: [
      "Unlimited products",
      "0% sales commission",
      "No Venfii branding",
      "WhatsApp order sync",
      "Mobile money reconciliation",
      "Bulk CSV product import",
      "Priority support",
    ],
  },
};

export function formatProductLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : `${limit} products`;
}
