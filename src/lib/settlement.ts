export const SETTLEMENT_TYPES = ["bank", "momo"] as const;
export type SettlementType = (typeof SETTLEMENT_TYPES)[number];

export const MOMO_CODES = ["MTN", "ATL", "VOD"] as const;

export function isMomoCode(code: string): code is (typeof MOMO_CODES)[number] {
  return (MOMO_CODES as readonly string[]).includes(code);
}
