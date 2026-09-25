/** Timestamp helpers. Chain values are Unix seconds; display is local-time. */

export function toSeconds(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatTimestamp(unixSeconds: number | string): string {
  const seconds = toSeconds(unixSeconds);
  if (!seconds) return "—";
  const date = new Date(seconds * 1000);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTimestampUtc(unixSeconds: number | string): string {
  const seconds = toSeconds(unixSeconds);
  if (!seconds) return "—";
  return new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function relativeRemaining(deadlineSeconds: number | string): string {
  const target = toSeconds(deadlineSeconds);
  if (!target) return "";
  const delta = target - Math.floor(Date.now() / 1000);
  if (delta <= 0) return "elapsed";
  const hours = Math.floor(delta / 3600);
  const minutes = Math.floor((delta % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${Math.max(1, minutes)}m remaining`;
}

/** Convert a datetime-local input value to Unix seconds, rejecting bad ranges. */
export function inputToSeconds(value: string): number {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) throw new Error("Enter a valid date and time");
  return Math.floor(time / 1000);
}

export function secondsToInput(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
