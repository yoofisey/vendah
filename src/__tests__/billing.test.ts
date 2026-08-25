import { describe, it, expect } from "vitest";
import {
  planCodeFor,
  planTierFromCode,
  planCycleFromCode,
  cycleAmountMinor,
  cycleName,
  GRACE_PERIOD_MS,
  isSubscriptionExpired,
  type SubscriptionRow,
} from "@/lib/billing";

describe("planCodeFor", () => {
  it("returns correct code for monthly", () => {
    expect(planCodeFor("starter", "monthly")).toBe("vendah-starter-m");
  });

  it("returns correct code for annual", () => {
    expect(planCodeFor("growth", "annual")).toBe("vendah-growth-y");
  });

  it("handles free tier", () => {
    expect(planCodeFor("free", "monthly")).toBe("vendah-free-m");
  });
});

describe("planTierFromCode", () => {
  it("extracts tier from valid code", () => {
    expect(planTierFromCode("vendah-starter-m")).toBe("starter");
    expect(planTierFromCode("vendah-growth-y")).toBe("growth");
    expect(planTierFromCode("vendah-free-m")).toBe("free");
    expect(planTierFromCode("vendah-industry-y")).toBe("industry");
  });

  it("returns null for invalid code", () => {
    expect(planTierFromCode("invalid")).toBeNull();
    expect(planTierFromCode("vendah-")).toBeNull();
    expect(planTierFromCode("vendah-starter")).toBeNull();
  });
});

describe("planCycleFromCode", () => {
  it("extracts cycle from valid code", () => {
    expect(planCycleFromCode("vendah-starter-m")).toBe("monthly");
    expect(planCycleFromCode("vendah-growth-y")).toBe("annual");
  });

  it("returns null for invalid code", () => {
    expect(planCycleFromCode("invalid")).toBeNull();
  });
});

describe("cycleAmountMinor", () => {
  it("returns monthly amount in minor units", () => {
    expect(cycleAmountMinor("starter", "monthly")).toBe(10000);
  });

  it("returns annual amount in minor units", () => {
    expect(cycleAmountMinor("starter", "annual")).toBe(100000);
  });

  it("free tier returns 0", () => {
    expect(cycleAmountMinor("free", "monthly")).toBe(0);
  });
});

describe("cycleName", () => {
  it("returns 'monthly' for monthly", () => {
    expect(cycleName("monthly")).toBe("monthly");
  });

  it("returns 'annually' for annual", () => {
    expect(cycleName("annual")).toBe("annually");
  });
});

describe("GRACE_PERIOD_MS", () => {
  it("is 3 days in milliseconds", () => {
    expect(GRACE_PERIOD_MS).toBe(3 * 24 * 60 * 60 * 1000);
  });
});

describe("isSubscriptionExpired", () => {
  const base: SubscriptionRow = {
    id: "sub-1",
    tenant_id: "t-1",
    tier: "starter",
    status: "active",
    billing_cycle: "monthly",
    provider_subscription_id: null,
    provider_customer_id: null,
    provider_customer_email: null,
    product_limit: 40,
    sales_fee_pct: 0,
    current_period_start: null,
    current_period_end: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("free tier is never expired", () => {
    expect(isSubscriptionExpired({ ...base, tier: "free" })).toBe(false);
  });

  it("expired when period end + grace is in the past", () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionExpired({ ...base, current_period_end: past })).toBe(true);
  });

  it("not expired when period end + grace is in the future", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionExpired({ ...base, current_period_end: future })).toBe(false);
  });

  it("expired when period end is missing", () => {
    expect(isSubscriptionExpired({ ...base, current_period_end: null })).toBe(true);
  });
});
