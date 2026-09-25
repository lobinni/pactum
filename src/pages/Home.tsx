import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileCheck2,
  Gavel,
  Landmark,
  LockKeyhole,
  Radar,
  Scale,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Kicker from "../components/Kicker";
import node1 from "../assets/avatars/node-1.jpg";
import node2 from "../assets/avatars/node-2.jpg";
import node3 from "../assets/avatars/node-3.jpg";
import node4 from "../assets/avatars/node-4.jpg";
import node5 from "../assets/avatars/node-5.jpg";
import node6 from "../assets/avatars/node-6.jpg";

const FLOW = [
  {
    icon: FileCheck2,
    title: "Seal the pact",
    body: "Provider freezes metric, target, window, exception clauses and the source policy — then escrows its bond.",
  },
  {
    icon: Radar,
    title: "Measure the miss",
    body: "Customer reports a completed observation window. Consensus corroborates it against independent sources.",
  },
  {
    icon: Gavel,
    title: "Claim the exception",
    body: "Provider points to one frozen clause and evidence from frozen origins — nothing invented after the fact.",
  },
  {
    icon: Scale,
    title: "Adjudicate & challenge",
    body: "Consensus decides meaning, intervals and causation. Either party may post a bonded challenge.",
  },
  {
    icon: Landmark,
    title: "Settle deterministically",
    body: "Code computes liability, pays the customer share, returns the rest, and both withdraw their credits.",
  },
];

const BOUNDARY_CODE = [
  "Agreement formation and party authorization",
  "Timing, thresholds and interval arithmetic",
  "Coverage of payouts vs frozen maximum credit",
  "Escrow partitions and accounting conservation",
];

const BOUNDARY_CONSENSUS = [
  "Whether sources corroborate the measured miss",
  "Whether facts establish the exact frozen clause",
  "Whether causation matches the observation window",
  "Whether a challenge warrants a revised finding",
];

export default function Home() {
  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <section className="p-shell">
        <div className="p-hero p-enter">
          <span className="p-hero-corners-br" aria-hidden />
          <svg className="community-paths" viewBox="0 0 1220 690" preserveAspectRatio="none" aria-hidden>
            <path d="M90 120 C 260 240, 380 180, 520 330" />
            <path d="M1140 150 C 980 220, 900 300, 760 380" />
            <path d="M170 600 C 320 480, 420 560, 560 470" />
            <path d="M1070 620 C 930 500, 860 520, 720 450" />
            <path d="M40 380 C 200 400, 300 330, 430 380" />
          </svg>

          <figure className="community-node no-mobile" style={{ top: "14%", left: "7%", ["--node-size" as any]: "58px" }}>
            <img src={node1} alt="Validator node avatar" />
          </figure>
          <figure className="community-node" style={{ top: "24%", right: "9%", ["--node-size" as any]: "66px", ["--node-delay" as any]: "-.8s" }}>
            <img src={node2} alt="Provider node avatar" />
            <span className="community-info">
              <span>
                <strong>Northpeak Ops</strong>
                <small>Bond sealed · 12 GEN</small>
              </span>
            </span>
          </figure>
          <figure className="community-node no-mobile" style={{ bottom: "30%", left: "13%", ["--node-size" as any]: "44px", ["--node-delay" as any]: "-2.1s" }}>
            <img src={node3} alt="Community node avatar" />
          </figure>
          <figure className="community-node" style={{ bottom: "18%", right: "16%", ["--node-size" as any]: "52px", ["--node-delay" as any]: "-3.4s" }}>
            <img src={node4} alt="Arbiter node avatar" />
            <span className="community-info">
              <span>
                <strong>Meridian Watch</strong>
                <small>Probe corroborated · 96.40%</small>
              </span>
            </span>
          </figure>
          <figure className="community-node no-mobile" style={{ top: "52%", left: "3.5%", ["--node-size" as any]: "38px", ["--node-delay" as any]: "-4.8s" }}>
            <img src={node5} alt="Nomad node avatar" />
          </figure>
          <figure className="community-node info-left" style={{ top: "12%", left: "26%", ["--node-size" as any]: "42px", ["--node-delay" as any]: "-1.4s" }}>
            <img src={node6} alt="Automation node avatar" />
            <span className="community-info">
              <span>
                <strong>Unit-6 Sentinel</strong>
                <small>Window closed · finality 08:12</small>
              </span>
            </span>
          </figure>

          <div className="p-hero-copy p-enter p-enter-1">
            <Kicker>GenLayer Studionet · Chain 61999</Kicker>
            <h1>
              Sealed SLA pacts.
              <br />
              <span>Proven</span> relief.
            </h1>
            <p>
              Deterministic escrow holds the provider's bond. Independent consensus proves the service miss first —
              then, and only then, judges whether a frozen exception clause excuses it.
            </p>
            <div className="p-hero-proof">
              <span><i />Deterministic settlement</span>
              <span><i />Consensus-adjudicated clauses</span>
              <span><i />Bonded challenges</span>
            </div>
            <div className="p-hero-actions">
              <Link className="p-btn p-btn-accent" to="/open">
                Seal an agreement <ArrowRight size={13} strokeWidth={2} />
              </Link>
              <Link className="p-btn p-btn-outline-light" to="/protocol">
                Read the protocol
              </Link>
            </div>
          </div>

          <div className="p-hero-meta p-hero-meta-left">
            <span>Escrow · GEN</span>
            <span>Finality · Consensus</span>
          </div>
          <div className="p-hero-meta">
            <span>Epoch 01</span>
            <span>UTC clock</span>
            <span>Live network</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- boundary */}
      <section className="p-zone p-shell">
        <div className="zone-head p-enter">
          <div>
            <Kicker>The split of duties</Kicker>
            <h2 style={{ marginTop: 20 }}>
              What code decides.
              <br />
              What <span>consensus</span> decides.
            </h2>
          </div>
          <p>
            SLA arithmetic is deliberately deterministic — nobody can expose collateral by typing a number, and no
            excuse may appear after failure. Consensus is restricted to the contested semantic questions.
          </p>
        </div>
        <div className="p-card-list" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <article className="task-card p-enter p-enter-1">
            <div className="task-card-head">
              <span className="p-folio">Deterministic · Exactly repeated by every validator</span>
              <span className="p-icon-box"><LockKeyhole size={18} strokeWidth={1.6} /></span>
            </div>
            <h3 style={{ marginTop: 26 }}>The ledger never negotiates</h3>
            <p>Timing, thresholds, money movement and evidence policy all execute identically everywhere.</p>
            <div className="task-card-meta" style={{ display: "grid", gap: 8 }}>
              {BOUNDARY_CODE.map((item) => (
                <span key={item} className="p-chip"><i />{item}</span>
              ))}
            </div>
          </article>
          <article className="task-card is-locked p-enter p-enter-2">
            <div className="task-card-head">
              <span className="p-folio" style={{ color: "var(--p-accent-dark)" }}>Consensus · Voted by validators</span>
              <span className="p-icon-box" style={{ background: "var(--p-accent-dark)", color: "#f8fcf9" }}>
                <Scale size={18} strokeWidth={1.6} />
              </span>
            </div>
            <h3 style={{ marginTop: 26 }}>Meaning is voted on</h3>
            <p>Only the questions deterministic systems cannot answer are submitted to GenLayer consensus.</p>
            <div className="task-card-meta" style={{ display: "grid", gap: 8 }}>
              {BOUNDARY_CONSENSUS.map((item) => (
                <span key={item} className="p-chip"><i />{item}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ------------------------------------------------------------ flow */}
      <section className="p-zone p-zone-night p-night">
        <div className="p-shell">
          <div className="zone-head">
            <div>
              <Kicker>Main lifecycle</Kicker>
              <h2 style={{ marginTop: 20 }}>
                Five moves
                <br />
                from pact to <span>payout</span>.
              </h2>
            </div>
            <p>
              Every transition is a signed write on Studionet. Keeper-style steps — verification, adjudication,
              finalization — can be triggered by anyone once their timing guards open.
            </p>
          </div>
          <div className="p-flow">
            {FLOW.map((step, index) => (
              <div key={step.title}>
                <span className="p-flow-num">{String(index + 1).padStart(2, "0")}</span>
                <b>Move {index + 1}</b>
                <p>{step.title}</p>
                <small>{step.body}</small>
              </div>
            ))}
          </div>

          <div className="p-metric-strip" style={{ marginTop: 22 }}>
            <div>
              <b>Exclusions per pact</b>
              <strong>8 <span>max</span></strong>
            </div>
            <div>
              <b>Evidence sources per stage</b>
              <strong>8 <span>max</span></strong>
            </div>
            <div>
              <b>Provider bond ceiling</b>
              <strong>50 <span>GEN</span></strong>
            </div>
            <div>
              <b>Accounting invariant</b>
              <strong>1:1 <span>always</span></strong>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- roles */}
      <section className="p-zone p-shell">
        <div className="zone-head">
          <div>
            <Kicker>Who plays</Kicker>
            <h2 style={{ marginTop: 20 }}>
              Three seats at
              <br />
              the <span>same table</span>
            </h2>
          </div>
          <p>
            Authorization is per-action: each step accepts exactly one role, enforced on-chain and mirrored in the
            interface.
          </p>
        </div>
        <div className="p-roles">
          <div className="p-enter p-enter-1">
            <span className="p-icon-box"><ShieldCheck size={18} strokeWidth={1.6} /></span>
            <h3>The Provider</h3>
            <p>
              Seals terms, escrows a GEN bond and earns the right to answer a verified miss with one frozen
              exception clause inside the response window.
            </p>
          </div>
          <div className="p-enter p-enter-2">
            <span className="p-icon-box"><Timer size={18} strokeWidth={1.6} /></span>
            <h3>The Customer</h3>
            <p>
              Accepts the pact, then opens an incident for a completed observation window — but the miss counts only
              if independent frozen sources corroborate it.
            </p>
          </div>
          <div className="p-enter p-enter-3">
            <span className="p-icon-box"><Scale size={18} strokeWidth={1.6} /></span>
            <h3>The Consensus</h3>
            <p>
              Validators re-fetch every frozen source, extract bounded manifests and vote on meaning — never on
              arithmetic, percentages or money.
            </p>
          </div>
        </div>

        <div className="p-panel p-enter" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "30px 28px", flexWrap: "wrap" }}>
          <div>
            <Kicker bare>Ready when the network is</Kicker>
            <h3 style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.04em", fontSize: "clamp(26px,3vw,38px)", margin: "12px 0 6px" }}>
              Seal your first pact on Studionet.
            </h3>
            <p style={{ color: "var(--p-muted)", margin: 0, fontSize: 13.5, maxWidth: 520 }}>
              Connect an injected wallet on chain 61999 and draft real terms — or start from the sample and replace
              every illustrative value before signing.
            </p>
          </div>
          <Link className="p-btn" to="/open">
            Open the agreement form <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}
