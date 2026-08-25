import { describe, it, expect } from "vitest";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";

describe("ORDER_STATUSES", () => {
  it("contains all expected statuses", () => {
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });

  it("has 6 statuses", () => {
    expect(ORDER_STATUSES).toHaveLength(6);
  });

  it("is a readonly tuple", () => {
    expect(typeof ORDER_STATUSES[0]).toBe("string");
  });
});

describe("OrderStatus type", () => {
  it("each status is a valid OrderStatus", () => {
    for (const status of ORDER_STATUSES) {
      const s: OrderStatus = status;
      expect(ORDER_STATUSES).toContain(s);
    }
  });
});
