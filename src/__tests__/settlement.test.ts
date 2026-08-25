import { describe, it, expect } from "vitest";
import { SETTLEMENT_TYPES, MOMO_CODES, isMomoCode } from "@/lib/settlement";

describe("SETTLEMENT_TYPES", () => {
  it("contains bank and momo", () => {
    expect(SETTLEMENT_TYPES).toEqual(["bank", "momo"]);
  });
});

describe("MOMO_CODES", () => {
  it("contains MTN, ATL, VOD", () => {
    expect(MOMO_CODES).toEqual(["MTN", "ATL", "VOD"]);
  });
});

describe("isMomoCode", () => {
  it("returns true for valid MoMo codes", () => {
    expect(isMomoCode("MTN")).toBe(true);
    expect(isMomoCode("ATL")).toBe(true);
    expect(isMomoCode("VOD")).toBe(true);
  });

  it("returns false for invalid codes", () => {
    expect(isMomoCode("airtel")).toBe(false);
    expect(isMomoCode("")).toBe(false);
    expect(isMomoCode("mtn")).toBe(false);
  });
});
