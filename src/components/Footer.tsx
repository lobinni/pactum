import { BookOpenText, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { addressExplorer, CONTRACT_ADDRESS, EXPLORER } from "../lib/config";
import { shortAddress } from "../lib/format";

export default function Footer() {
  return (
    <footer className="p-footer">
      <div className="p-shell">
        <div className="p-footer-grid">
          <div className="p-footer-brand">
            <div className="p-brand">
              <span className="p-brand-mark" style={{ background: "var(--p-accent)", color: "var(--p-ink)" }}>P</span>
              <span className="p-brand-name" style={{ color: "#f8fcf9" }}>PACTUM</span>
            </div>
            <p>
              Provider-backed SLA exception protocol. Deterministic escrow and settlement;
              GenLayer consensus only where meaning is contested. Hard-locked to Studionet, chain 61999.
            </p>
            <div className="p-socials">
              <a href={EXPLORER} target="_blank" rel="noreferrer" aria-label="Block explorer">
                <ScrollText size={14} strokeWidth={1.6} />
              </a>
              <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" aria-label="Protocol documentation">
                <ShieldCheck size={14} strokeWidth={1.6} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="Source repository">
                <BookOpenText size={14} strokeWidth={1.6} />
              </a>
            </div>
          </div>
          <div>
            <h4>Protocol</h4>
            <Link to="/agreements">Agreements</Link>
            <Link to="/open">New Agreement</Link>
            <Link to="/protocol">Protocol &amp; lifecycle</Link>
            <Link to="/account">Account &amp; credits</Link>
          </div>
          <div>
            <h4>Network</h4>
            <a href={EXPLORER} target="_blank" rel="noreferrer">Studionet explorer</a>
            <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer">GenLayer Studio</a>
            <a href={addressExplorer(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
              Deployment · {shortAddress(CONTRACT_ADDRESS)}
            </a>
          </div>
        </div>
        <div className="p-footer-bar">
          <span>PACTUM · Consensus-sealed SLA relief</span>
          <span>Chain 61999 · Injected EIP-1193 only · No admin surface</span>
        </div>
      </div>
    </footer>
  );
}
