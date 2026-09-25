import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Braces,
  Eye,
  LockKeyhole,
  Network,
  Scale,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import Kicker from "../components/Kicker";
import { addressExplorer, CHAIN_ID, CONTRACT_ADDRESS, EXPLORER, RPC } from "../lib/config";
import { shortAddress } from "../lib/format";

const LIMITS = [
  ["Provider bond", "0.001 — 50 GEN, escrowed at formation, must cover the maximum credit"],
  ["Challenge stake", "0.0001 — 10 GEN, escrowed with the challenge, awarded on the outcome"],
  ["Exception clauses", "1 — 8 frozen clauses per pact, unique uppercase codes"],
  ["Evidence per stage", "1 — 8 sources for exceptions and challenges; 2 — 8 with an independent probe for measurement"],
  ["Source policy", "1 — 8 frozen origins per group, each with host, path prefix and retrieval mode"],
  ["Coverage window", "30 minutes — 90 days, starting no sooner than 10 minutes after proposal"],
  ["Formation lead", "The customer must accept at least 5 minutes before coverage begins"],
  ["Provider response", "1 hour after a verified miss to claim a frozen exception"],
  ["Challenge window", "10 minutes — 24 hours, frozen per pact at formation"],
  ["Retry windows", "6 hours for unavailable measurement evidence; 24 hours for challenges"],
];

const NETWORK_ROWS = [
  ["Network", "GenLayer Studionet"],
  ["Chain id", String(CHAIN_ID)],
  ["RPC gateway", RPC],
  ["Explorer", EXPLORER],
  ["Native symbol", "GEN"],
  ["Wallet surface", "injected EIP-1193 (MetaMask compatible) only"],
  ["Contract address", shortAddress(CONTRACT_ADDRESS)],
];

export default function Protocol() {
  return (
    <div className="p-page">
      <section className="p-shell p-zone" style={{ paddingTop: 56 }}>
        <div className="zone-head p-enter">
          <div>
            <Kicker>The rules, in plain language</Kicker>
            <h1 style={{ marginTop: 20 }}>
              Protocol
              <br />
              Notes<span>.</span>
            </h1>
          </div>
          <p>
            PACTUM is one Intelligent Contract doing two jobs: deterministic custody and arithmetic everywhere it
            belongs, and consensus voting only where the question is about meaning. This page is the human-readable
            reference; the repository documents the machine-readable guarantee.
          </p>
        </div>

        {/* lifecycle strip */}
        <div className="p-shell" style={{ padding: 0 }}>
          <div
            className="p-panel p-enter p-enter-1"
            style={{
              background: "var(--p-night)",
              color: "#f8fcf9",
              border: "1px solid var(--p-line)",
              padding: "34px 30px",
              backgroundImage:
                "linear-gradient(#35d5b40d 1px, transparent 1px), linear-gradient(90deg, #35d5b40d 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <Kicker bare>
                <span style={{ color: "var(--p-accent)" }}>Lifecycle in one breath</span>
              </Kicker>
              <span className="p-folio" style={{ color: "#f8fcf961" }}>signed writes · consensus where marked</span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
                marginTop: 22,
                font: "500 11px/1 var(--font-dm-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {[
                "Seal agreement",
                "Customer accepts",
                "Open incident",
                "Verify measurement ✳",
                "Claim exception",
                "Adjudicate ✳",
                "Optional challenge ✳",
                "Finalize & settle",
                "Withdraw credit",
              ].map((step, index) => (
                <span key={step} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      border: "1px solid #35d5b440",
                      background: step.includes("✳") ? "#35d5b41f" : "transparent",
                      padding: "9px 12px",
                      color: step.includes("✳") ? "var(--p-accent)" : "#f8fcf9d9",
                    }}
                  >
                    {step.replace(" ✳", "")}
                  </span>
                  {index < 8 && <ArrowRight size={12} style={{ color: "#35d5b470" }} />}
                </span>
              ))}
            </div>
            <p style={{ color: "#f8fcf98f", fontSize: 12, marginTop: 18, marginBottom: 0, letterSpacing: "0.04em", textTransform: "uppercase", font: "400 9.5px/1.8 var(--font-dm-mono)" }}>
              Highlighted steps run through GenLayer consensus; everything else executes identically on every validator.
            </p>
          </div>
        </div>

        {/* guarantees */}
        <div className="p-card-list p-enter p-enter-2" style={{ marginTop: 26 }}>
          {[
            {
              icon: LockKeyhole,
              title: "Custody is arithmetic",
              body: "Bonds, stakes and payouts live in four audited partitions that must always sum to total deposits. Settlement moves value to credits; only the owner withdraws.",
            },
            {
              icon: Scale,
              title: "Consensus is contained",
              body: "Exactly three questions ever reach validators: corroboration of the miss, whether evidence establishes the exact frozen clause, and whether a challenge warrants revision.",
            },
            {
              icon: Braces,
              title: "Evidence is provider-neutral",
              body: "Sources are fetched identically everywhere, reduced to bounded structured manifests, clipped to the frozen window, and digested — narrative reasoning never enters consensus.",
            },
            {
              icon: ShieldAlert,
              title: "Nothing is invented late",
              body: "Clauses, origins and retrieval modes freeze at formation. Unavailable, stale or unattributable evidence produces INCONCLUSIVE — never relief, never breach.",
            },
            {
              icon: Eye,
              title: "Keeper actions stay open",
              body: "Verification, adjudication, challenge resolution, expiry and finalization can be triggered by anyone once timing guards pass. No action needs a privileged key.",
            },
            {
              icon: BadgeCheck,
              title: "No admin surface",
              body: "There is no owner, no upgrade hook, no pause switch. The deployment record is provenance; the chain is the only authority.",
            },
          ].map((item) => (
            <article key={item.title} className="task-card" style={{ minHeight: 240 }}>
              <div className="task-card-head">
                <span className="p-folio">Guarantee</span>
                <span className="p-icon-box"><item.icon size={17} strokeWidth={1.6} /></span>
              </div>
              <h3 style={{ marginTop: 22 }}>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* limits + network */}
      <section className="p-shell" style={{ paddingBottom: 96 }}>
        <div className="p-case-grid">
          <div className="p-panel p-enter">
            <div className="p-panel-head">
              <span>Protocol limits</span>
              <span>deterministic guards</span>
            </div>
            <div className="p-panel-body" style={{ paddingTop: 10 }}>
              {LIMITS.map(([label, value]) => (
                <div className="ledger-row" key={label}>
                  <span>{label}</span>
                  <b style={{ fontWeight: 500 }}>{value}</b>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 22 }}>
            <div className="p-panel p-enter p-enter-1">
              <div className="p-panel-head">
                <span>Network binding</span>
                <span>hard-locked</span>
              </div>
              <div className="p-panel-body" style={{ paddingTop: 10 }}>
                {NETWORK_ROWS.map(([label, value]) => (
                  <div className="ledger-row" key={label}>
                    <span>{label}</span>
                    <b style={{ fontWeight: 500 }}>
                      {label === "Explorer" ? (
                        <a href={value} target="_blank" rel="noreferrer" style={{ color: "var(--p-accent-dark)" }}>{value}</a>
                      ) : label === "Contract address" ? (
                        <a href={addressExplorer(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" style={{ color: "var(--p-accent-dark)" }}>{value}</a>
                      ) : (
                        value
                      )}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-panel p-enter p-enter-2">
              <div className="p-panel-head">
                <span>Deploying a fresh release</span>
                <span>release runbook</span>
              </div>
              <div className="p-panel-body" style={{ display: "grid", gap: 12 }}>
                {[
                  ["1", "Pin the toolchain", "Python 3.12 with the pinned GenLayer test, runtime and linter packages; Node 22 with the pinned client library."],
                  ["2", "Run the static guards", "Pattern and wiring checks must pass before any network call; they reward nothing and block everything inconsistent."],
                  ["3", "Run the Direct Mode suite", "All behavioural and adversarial tests green, plus the GenVM linter over the contract."],
                  ["4", "Deploy to Studionet", "The deployment script signs with a funded 61999 account, waits for FINALIZED consensus, and verifies the reported network."],
                  ["5", "Publish the address", "The script updates the deployments record and the application environment in one step — the UI repoints without code edits."],
                ].map(([num, title, body]) => (
                  <div key={num} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, alignItems: "start" }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        background: "var(--p-accent-soft)",
                        color: "var(--p-accent-dark)",
                        font: "700 13px/1 var(--font-syne)",
                      }}
                    >
                      {num}
                    </span>
                    <div>
                      <b style={{ fontSize: 13.5 }}>{title}</b>
                      <p style={{ margin: "3px 0 0", color: "var(--p-muted)", fontSize: 12.5, lineHeight: 1.6 }}>{body}</p>
                    </div>
                  </div>
                ))}
                <Link className="p-btn p-btn-sm" to="/open" style={{ justifySelf: "start", marginTop: 6 }}>
                  Seal an agreement <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <div className="p-panel p-enter p-enter-3">
              <div className="p-panel-body" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Network size={16} style={{ color: "var(--p-accent-dark)", flex: "none", marginTop: 2 }} />
                <p style={{ margin: 0, color: "var(--p-muted)", fontSize: 12.5, lineHeight: 1.7 }}>
                  Participation always starts the same way: connect an injected wallet and make sure it is set to
                  GenLayer Studionet (chain 61999). The interface offers the network switch and refuses to submit
                  from any other chain. <Wallet size={12} style={{ verticalAlign: "-2px" }} /> reads stay public and
                  signature-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
