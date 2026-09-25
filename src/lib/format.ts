/** Display formatting for protocol data. */

export function shortAddress(address: string, head = 6, tail = 4): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || "")) return address || "—";
  return `${address.slice(0, head + 2)}…${address.slice(-tail)}`;
}

export function bpsToPercent(bps: number | string): string {
  const value = Number(bps);
  if (!Number.isFinite(value)) return "—";
  return (value / 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "%";
}

export function formatBps(bps: number | string): string {
  const value = Number(bps);
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString("en-US")} bps`;
}

export function plural(count: number, noun: string, suffix = "s"): string {
  return `${count} ${noun}${count === 1 ? "" : suffix}`;
}

/** Friendly label + tone for every protocol status. */
const STATUS_TONE: Record<string, "ok" | "warn" | "danger" | "muted" | "night"> = {
  PROPOSED: "warn",
  ACTIVE: "ok",
  CLOSED: "muted",
  EXPIRED: "muted",
  MEASUREMENT_PENDING: "warn",
  MEASUREMENT_INCONCLUSIVE: "danger",
  MEASUREMENT_REJECTED: "muted",
  OPEN: "ok",
  EXCEPTION_CLAIMED: "danger",
  INCONCLUSIVE: "warn",
  PENDING: "warn",
  FINAL: "ok",
  VERIFIED: "ok",
  PROVEN: "ok",
  PARTIAL: "warn",
  NOT_PROVEN: "muted",
  UPHELD: "ok",
  REJECTED: "danger",
  INCONCLUSIVE_FINAL: "muted",
  DEFAULT_NOT_PROVEN: "danger",
  SOURCE_UNAVAILABLE: "muted",
};

export function statusTone(status: string): "ok" | "warn" | "danger" | "muted" | "night" {
  return STATUS_TONE[(status || "").toUpperCase()] ?? "muted";
}

export function statusLabel(status: string): string {
  return (status || "unknown").replace(/_/g, " ");
}

const AGREEMENT_LABELS: Record<string, string> = {
  PROPOSED: "Proposed",
  ACTIVE: "Active",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

export function agreementLabel(status: string): string {
  return AGREEMENT_LABELS[(status || "").toUpperCase()] ?? statusLabel(status);
}

export function idToDisplay(id: string): string {
  // "pc-a-12" -> "Agreement 12", "pc-i-4" -> "Incident 4"
  const match = /^pc-([ai])-(\d+)$/.exec(id || "");
  if (!match) return id || "—";
  return `${match[1] === "a" ? "Agreement" : "Incident"} ${match[2]}`;
}
