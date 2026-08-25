import type { PlanId } from "@/lib/types";

export type Plan = {
  name: string;
  monthlyGhs: number;
  annualGhs: number;
  productLimit: number | null;
  salesFeePct: number;
  poweredByFooter: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    name: "Free",
    monthlyGhs: 0,
    annualGhs: 0,
    productLimit: 20,
    salesFeePct: 6,
    poweredByFooter: true,
  },
  starter: {
    name: "Starter",
    monthlyGhs: 100,
    annualGhs: 1000,
    productLimit: 40,
    salesFeePct: 0,
    poweredByFooter: false,
  },
  growth: {
    name: "Growth",
    monthlyGhs: 200,
    annualGhs: 2000,
    productLimit: 80,
    salesFeePct: 0,
    poweredByFooter: false,
  },
  industry: {
    name: "Industry",
    monthlyGhs: 400,
    annualGhs: 4000,
    productLimit: null,
    salesFeePct: 0,
    poweredByFooter: false,
  },
};

export function formatProductLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : `${limit} products`;
}
