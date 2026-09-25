import { AlertTriangle, CheckCircle2, ExternalLink, Hourglass } from "lucide-react";
import { txExplorer } from "../lib/config";

export type TxState =
  | { kind: "idle" }
  | { kind: "pending"; hash?: string; stage: string }
  | { kind: "finalized"; hash: string; detail?: string }
  | { kind: "error"; message: string; hash?: string };

export default function TxNotice({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "pending") {
    return (
      <div className="p-notice" style={{ marginTop: 14 }}>
        <span className="p-spin" style={{ marginTop: 2 }} />
        <span>
          Transaction {state.stage}. GenLayer consensus can take a while — keep this tab open.
          {state.hash ? (
            <>
              {" "}
              <a href={txExplorer(state.hash)} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                Track on explorer
              </a>
            </>
          ) : null}
        </span>
      </div>
    );
  }
  if (state.kind === "finalized") {
    return (
      <div className="p-notice" style={{ marginTop: 14 }}>
        <CheckCircle2 size={14} />
        <span>
          Finalized by consensus{state.detail ? ` — ${state.detail}` : ""}.{" "}
          <a href={txExplorer(state.hash)} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
            View receipt <ExternalLink size={10} style={{ verticalAlign: "baseline" }} />
          </a>
        </span>
      </div>
    );
  }
  return (
    <div className="p-notice p-notice-danger" style={{ marginTop: 14 }}>
      <AlertTriangle size={14} />
      <span>
        {state.message}
        {state.hash ? (
          <>
            {" "}
            <a href={txExplorer(state.hash)} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              Inspect transaction
            </a>
          </>
        ) : null}
      </span>
    </div>
  );
}

export function hourglassNote() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Hourglass size={12} /> Awaiting wallet signature
    </span>
  );
}
