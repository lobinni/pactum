import { useState } from "react";
import { AlertTriangle, Unplug, Wallet } from "lucide-react";
import { useWallet } from "./WalletContext";
import { shortAddress } from "../lib/format";

export default function WalletButton() {
  const wallet = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const connect = async () => {
    setBusy(true);
    setError("");
    try {
      await wallet.connect();
    } catch (e: any) {
      setError(e?.message || "Wallet connection was rejected");
    } finally {
      setBusy(false);
    }
  };

  const switchNetwork = async () => {
    setBusy(true);
    setError("");
    try {
      await wallet.switchNetwork();
    } catch (e: any) {
      setError(e?.message || "Network switch was rejected");
    } finally {
      setBusy(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div style={{ position: "relative" }}>
        <button className="p-btn p-btn-sm" onClick={connect} disabled={busy}>
          {busy ? <span className="p-spin" /> : <Wallet size={13} strokeWidth={1.8} />}
          {busy ? "Connecting" : "Connect Wallet"}
        </button>
        {error && (
          <div
            className="p-notice p-notice-danger"
            style={{ position: "absolute", top: 44, right: 0, width: 260, zIndex: 60 }}
          >
            <AlertTriangle size={13} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (!wallet.correctNetwork) {
    return (
      <div style={{ position: "relative" }}>
        <button className="p-btn p-btn-sm" style={{ background: "var(--p-danger)", borderColor: "var(--p-danger)" }} onClick={switchNetwork} disabled={busy}>
          {busy ? <span className="p-spin" /> : <AlertTriangle size={13} strokeWidth={1.8} />}
          Switch to Studionet
        </button>
        {error && (
          <div className="p-notice p-notice-danger" style={{ position: "absolute", top: 44, right: 0, width: 260, zIndex: 60 }}>
            <AlertTriangle size={13} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span className="p-chip p-chip-solid" title={wallet.address || ""}>
        <i />
        {shortAddress(wallet.address || "")}
      </span>
      <button
        className="p-btn p-btn-ghost p-btn-sm"
        onClick={wallet.disconnect}
        title="Disconnect wallet view"
        aria-label="Disconnect wallet view"
        style={{ minHeight: 34, padding: "0 10px" }}
      >
        <Unplug size={13} strokeWidth={1.8} />
      </button>
    </div>
  );
}
