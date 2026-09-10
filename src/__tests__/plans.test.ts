import { describe, it, expect } from "vitest";
import { PLANS, formatProductLimit } from "@/lib/plans";

describe("PLANS", () => {
  it("has all four tiers", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "starter", "growth", "industry"]);
  });

  it("free plan has 6% fee and 20 product limit", () => {
    expect(PLANS.free.salesFeePct).toBe(6);
    expect(PLANS.free.productLimit).toBe(20);
    expect(PLANS.free.monthlyGhs).toBe(0);
  });

  it("starter plan has 0% fee and 40 product limit", () => {
    expect(PLANS.starter.salesFeePct).toBe(0);
    expect(PLANS.starter.productLimit).toBe(40);
    expect(PLANS.starter.monthlyGhs).toBe(100);
  });

  it("growth plan has 80 product limit", () => {
    expect(PLANS.growth.productLimit).toBe(80);
    expect(PLANS.growth.monthlyGhs).toBe(200);
  });

  it("industry plan has unlimited products", () => {
    expect(PLANS.industry.productLimit).toBeNull();
    expect(PLANS.industry.monthlyGhs).toBe(400);
  });

  it("annual pricing is roughly 10x monthly (with discount)", () => {
    expect(PLANS.starter.annualGhs).toBe(1000);
    expect(PLANS.growth.annualGhs).toBe(2000);
    expect(PLANS.industry.annualGhs).toBe(4000);
  });

  it("only free plan shows powered-by footer", () => {
    expect(PLANS.free.poweredByFooter).toBe(true);
    expect(PLANS.starter.poweredByFooter).toBe(false);
    expect(PLANS.growth.poweredByFooter).toBe(false);
    expect(PLANS.industry.poweredByFooter).toBe(false);
  });

  it("growth adds WhatsApp sync and mobile money reconciliation", () => {
    expect(PLANS.growth.features).toEqual(
      expect.arrayContaining([
        "WhatsApp order sync",
        "Mobile money reconciliation",
      ])
    );
    expect(PLANS.starter.features).not.toEqual(
      expect.arrayContaining(["WhatsApp order sync"])
    );
  });

  it("industry adds bulk CSV import", () => {
    expect(PLANS.industry.features).toEqual(
      expect.arrayContaining(["Bulk CSV product import"])
    );
    expect(PLANS.growth.features).not.toEqual(
      expect.arrayContaining(["Bulk CSV product import"])
    );
  });

  it("every plan lists its distinguishing features", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});

describe("formatProductLimit", () => {
  it("returns 'Unlimited' for null", () => {
    expect(formatProductLimit(null)).toBe("Unlimited");
  });

  it("formats numeric limits", () => {
    expect(formatProductLimit(20)).toBe("20 products");
    expect(formatProductLimit(40)).toBe("40 products");
  });
});
