import { statusLabel, statusTone } from "../lib/format";

export default function StatusChip({ status }: { status: string }) {
  return <span className={`p-status p-status-${statusTone(status)}`}>{statusLabel(status)}</span>;
}
