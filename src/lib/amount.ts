/** Atto-GEN (10^18) parsing and display formatting. */

const ATTO = 10n ** 18n;

export function parseGenAmount(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) throw new Error("Enter a positive GEN amount, e.g. 1.5");
  const [whole, fraction = ""] = trimmed.split(".");
  const padded = (fraction + "0".repeat(18)).slice(0, 18);
  return BigInt(whole) * ATTO + BigInt(padded || "0");
}

export function formatGenAmount(atto: string | number | bigint, maximumFractionDigits = 4): string {
  const big = BigInt(atto);
  const whole = big / ATTO;
  const fraction = Number((big % ATTO) * 10000n / ATTO) / 10000;
  const combined = Number(whole) + fraction;
  if (combined === 0) return "0";
  return combined.toLocaleString("en-US", { maximumFractionDigits });
}

export function gen(value: string | number): bigint {
  return parseGenAmount(String(value));
}
