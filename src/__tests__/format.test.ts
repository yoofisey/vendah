import { describe, it, expect } from "vitest";
import {
  formatMoney,
} from "@/lib/format";

describe("formatMoney", () => {
  it("formats GHS with the cedi symbol", () => {
    expect(formatMoney(1000)).toBe("GH₵10.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("GH₵0.00");
  });

  it("formats negative amounts", () => {
    expect(formatMoney(-500)).toBe("GH₵-5.00");
  });

  it("formats large amounts", () => {
    expect(formatMoney(123456789)).toBe("GH₵1234567.89");
  });

  it("uses generic symbol for non-GHS currencies", () => {
    expect(formatMoney(2500, "USD")).toBe("USD 25.00");
    expect(formatMoney(2500, "NGN")).toBe("NGN 25.00");
  });

  it("handles fractional minor units", () => {
    expect(formatMoney(1555)).toBe("GH₵15.55");
  });
});
