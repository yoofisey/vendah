export function formatMoney(minor: number, currency = "GHS"): string {
  const symbol = currency === "GHS" ? "GH₵" : `${currency} `;
  return `${symbol}${(minor / 100).toFixed(2)}`;
}
