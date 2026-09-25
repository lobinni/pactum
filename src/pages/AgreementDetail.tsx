import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FilePen,
  Gavel,
  Landmark,
  Radar,
  Sparkles,
} from "lucide-react";
import Kicker from "../components/Kicker";
import StatusChip from "../components/StatusChip";
import EmptyState from "../components/EmptyState";
import TxNotice from "../components/TxNotice";
import { getAgreement, getIncident } from "../lib/contract";
import { useRead } from "../lib/useRead";
import { useAction } from "../lib/useAction";
import { useWallet } from "../components/WalletContext";
import { bpsToPercent, idToDisplay, shortAddress } from "../lib/format";
import { formatGenAmount, parseGenAmount } from "../lib/amount";
import { formatTimestamp, inputToSeconds, relativeRemaining, secondsToInput } from "../lib/time";
import type { Agreement, Challenge, Incident } from "../lib/types";

/* ------------------------------------------------------------------ bits */

function Ledger({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <div>
      {rows.map(([label, value]) => (
        <div className="ledger-row" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

function ActionBox({
  title,
  body,
  actionLabel,
  onRun,
  busy,
  tx,
  children,
  done,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onRun: () => Promise<boolean>;
  busy: boolean;
  tx: React.ReactNode;
  children?: React.ReactNode;
  done?: boolean;
}) {
  if (done) return null;
  return (
    <div className="p-action">
      <b>{title}</b>
      <p>{body}</p>
      {children}
      <button className="p-btn p-btn-sm" onClick={onRun} disabled={busy}>
        {busy && <span className="p-spin" />}
        {actionLabel}
      </button>
      {tx}
    </div>
  );
}

interface EvidenceDraft {
  kind: string;
  url: string;
  note: string;
}

function EvidenceEditor({
  group,
  kinds,
  items,
  onChange,
}: {
  group: string;
  kinds: string[];
  items: EvidenceDraft[];
  onChange: (items: EvidenceDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<EvidenceDraft>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <div style={{ display: "grid", gap: 12, margin: "0 0 14px" }}>
      {items.map((item, index) => (
        <div key={index} className="p-panel" style={{ padding: 14, borderStyle: "dashed" }}>
          <div className="p-field" style={{ marginBottom: 10 }}>
            <label>
              {group} source {index + 1} · family
            </label>
            <select value={item.kind} onChange={(e) => update(index, { kind: e.target.value })}>
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="p-field" style={{ marginBottom: 10 }}>
            <label>Public URL (HTTPS, from a frozen origin)</label>
            <input
              value={item.url}
              placeholder="https://…"
              onChange={(e) => update(index, { url: e.target.value })}
            />
          </div>
          <div className="p-field" style={{ marginBottom: 0 }}>
            <label>Read note for the validators</label>
            <input
              value={item.note}
              placeholder="What this source proves, in one sentence"
              onChange={(e) => update(index, { note: e.target.value })}
            />
          </div>
        </div>
      ))}
      {items.length > 1 && (
        <button
          className="p-btn p-btn-ghost p-btn-sm"
          style={{ justifySelf: "start" }}
          onClick={() => onChange(items.slice(0, -1))}
        >
          Remove last source
        </button>
      )}
      {items.length < 8 && kinds.length > items.length && (
        <button
          className="p-btn p-btn-ghost p-btn-sm"
          style={{ justifySelf: "start" }}
          onClick={() => onChange([...items, { kind: kinds[items.length] ?? kinds[0], url: "", note: "" }])}
        >
          Add another frozen source
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- main view */

export default function AgreementDetail() {
  const params = useParams();
  const id = params.id || "";
  const wallet = useWallet();
  const agreementRead = useRead(() => getAgreement(id), [id]);
  const a: Agreement | null = agreementRead.data;
  const incidentRead = useRead(() => (a?.incident_id ? getIncident(a.incident_id) : Promise.resolve(null)), [a?.incident_id]);
  const i: Incident | null = incidentRead.data;
  const challenge: Challenge | null = useMemo(() => {
    if (!i?.challenge) return null;
    try {
      return JSON.parse(i.challenge);
    } catch {
      return null;
    }
  }, [i?.challenge]);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const action = useAction(() => {
    agreementRead.reload();
    incidentRead.reload();
  });

  const me = (wallet.address || "").toLowerCase();
  const isCustomer = !!a && me === (a.customer || "").toLowerCase();
  const isProvider = !!a && me === (a.provider || "").toLowerCase();
  const isParty = isCustomer || isProvider;

  /* open incident form */
  const [actualBps, setActualBps] = useState("");
  const [obsFrom, setObsFrom] = useState("");
  const [obsTo, setObsTo] = useState("");
  const [mEvidence, setMEvidence] = useState<EvidenceDraft[]>([]);
  const [incidentSampled, setIncidentSampled] = useState(false);
  /* claim form */
  const [claimCode, setClaimCode] = useState("");
  const [xEvidence, setXEvidence] = useState<EvidenceDraft[]>([]);
  /* challenge form */
  const [challengeText, setChallengeText] = useState("");
  const [challengeUrl, setChallengeUrl] = useState("");
  const [challengeStake, setChallengeStake] = useState("");

  const measurementKinds = a?.source_policy?.measurement?.map((e) => e.kind) ?? [];
  const exceptionKinds = a?.source_policy?.exception?.map((e) => e.kind) ?? [];

  const effectiveMEvidence: EvidenceDraft[] =
    mEvidence.length > 0 ? mEvidence : measurementKinds.slice(0, 2).map((kind) => ({ kind, url: "", note: "" }));
  const effectiveXEvidence: EvidenceDraft[] =
    xEvidence.length > 0 ? xEvidence : exceptionKinds.slice(0, 1).map((kind) => ({ kind, url: "", note: "" }));

  const safeSeconds = (value: string) => {
    try {
      return value ? inputToSeconds(value) : 0;
    } catch {
      return 0;
    }
  };

  // Prefill a valid observation window in STATE (not only in display) as soon
  // as the agreement arrives: from the coverage start to the latest completed
  // time (min of coverage end and now). Users may adjust either side.
  useEffect(() => {
    if (!a) return;
    const latestCompleted = Math.max(Number(a.window_start) + 60, Math.min(Number(a.window_end), Math.floor(Date.now() / 1000) - 60));
    setObsFrom(secondsToInput(Number(a.window_start)));
    setObsTo(secondsToInput(latestCompleted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id]);

  const obsFromInput = obsFrom || (a ? secondsToInput(Number(a.window_start)) : "");
  const obsToInput = obsTo || (a ? secondsToInput(Number(a.window_end)) : "");
  const obsFromSec = safeSeconds(obsFromInput);
  const obsToSec = safeSeconds(obsToInput);

  // Picker bounds mirror the on-chain interval guard exactly.
  const obsMinInput = a ? secondsToInput(Number(a.window_start)) : "";
  const obsMaxInput = a ? secondsToInput(Math.min(Number(a.window_end), nowSeconds)) : "";
  const observationPossible = !!a && nowSeconds > Number(a.window_start) + 60;
  const observationContained =
    !!a &&
    obsFromSec >= Number(a.window_start) &&
    obsToSec <= Number(a.window_end) &&
    obsToSec > obsFromSec &&
    obsToSec <= nowSeconds + 60;

  const actualOk =
    actualBps.trim() !== "" && Number(actualBps) >= 0 && Number(actualBps) < Number(a?.target_bps ?? 0);
  const evidenceOk =
    effectiveMEvidence.length >= 2 &&
    effectiveMEvidence.every((e) => e.url.startsWith("https://") && e.note.trim().length >= 4);

  const openIncidentReady = actualOk && observationContained && evidenceOk;

  const challengeStakeOk = useMemo(() => {
    try {
      const stake = parseGenAmount(challengeStake);
      return stake >= 10n ** 14n && stake <= 10n * 10n ** 18n;
    } catch {
      return false;
    }
  }, [challengeStake]);

  const challengeReady =
    challengeText.trim().length >= 20 && challengeUrl.startsWith("https://") && challengeStakeOk;

  const claimReady = !!claimCode && effectiveXEvidence.every((e) => e.url.startsWith("https://") && e.note.trim().length >= 4);

  /**
   * Opt-in sample incident for two-wallet testing. Every value respects the
   * frozen on-chain guards (probe + corroborating family, URLs strictly under
   * the frozen origins, availability below target); illustrative URLs and
   * notes must be checked and replaced before a real submission.
   */
  const loadSampleIncident = () => {
    if (!a) return;
    const target = Number(a.target_bps);
    setActualBps(String(Math.max(0, target - 50)));
    const latestCompleted = Math.max(
      Number(a.window_start) + 60,
      Math.min(Number(a.window_end), Math.floor(Date.now() / 1000) - 60),
    );
    setObsFrom(secondsToInput(Number(a.window_start)));
    setObsTo(secondsToInput(latestCompleted));
    const policy = a.source_policy?.measurement ?? [];
    const probe = policy.find((entry) => entry.kind === "INDEPENDENT_PROBE") ?? policy[0];
    const corroborating = policy.find((entry) => entry !== probe) ?? policy[1] ?? probe;
    const toDraft = (entry: { kind: string; host: string; path_prefix: string }): EvidenceDraft => ({
      kind: entry.kind,
      url: `https://${entry.host}${entry.path_prefix === "/" ? "/incident-sample" : `${entry.path_prefix}/incident-sample`}`,
      note: "Illustrative note for testing — replace with the facts this source shows for the observation window.",
    });
    setMEvidence([probe, corroborating].filter(Boolean).map(toDraft));
    setIncidentSampled(true);
  };

  const submitOpenIncident = () =>
    action.run("open_incident", [
      id,
      Number(actualBps),
      obsFromSec,
      obsToSec,
      JSON.stringify(effectiveMEvidence.map(({ kind, url, note }) => ({ kind, url, note }))),
    ]);

  const submitClaim = () =>
    action.run("claim_exception", [
      i!.id,
      claimCode,
      JSON.stringify(effectiveXEvidence.map(({ kind, url, note }) => ({ kind, url, note }))),
    ]);

  const submitChallenge = () => action.run("challenge_exception", [i!.id, challengeText, challengeUrl], parseGenAmount(challengeStake));

  if (!agreementRead.configured) {
    return (
      <div className="p-page p-shell p-zone">
        <EmptyState
          title="Deployment address not configured"
          body="This case view reads directly from chain 61999 once the canonical address is published in configuration."
          ctaLabel="Back to the ledger"
          ctaTo="/agreements"
        />
      </div>
    );
  }

  if (agreementRead.loading) {
    return (
      <div className="p-page p-shell p-zone">
        <div className="p-empty"><span className="p-spin" style={{ margin: "0 auto", width: 26, height: 26, borderWidth: 2 }} /></div>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="p-page p-shell p-zone">
        <EmptyState
          title="Agreement not found"
          body={agreementRead.error ? `The read failed: ${agreementRead.error}` : "No pact with this identifier exists on the canonical deployment."}
          ctaLabel="Back to the ledger"
          ctaTo="/agreements"
        />
      </div>
    );
  }

  const formationOpen = a.status === "PROPOSED" && nowSeconds < Number(a.formation_deadline);

  return (
    <div className="p-page">
      <section className="p-shell p-zone" style={{ paddingTop: 46 }}>
        <div className="p-enter" style={{ marginBottom: 26 }}>
          <Link to="/agreements" className="p-folio" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={12} /> Back to the ledger
          </Link>
        </div>

        <div className="zone-head p-enter" style={{ marginBottom: 30 }}>
          <div>
            <Kicker>
              {idToDisplay(a.id)} · {a.metric_name}
            </Kicker>
            <h1 style={{ marginTop: 20, fontSize: "clamp(38px,5vw,64px)" }}>
              {a.service_name}
            </h1>
          </div>
          <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
            <StatusChip status={a.status} />
            <a className="p-folio" href={`https://explorer-studio.genlayer.com/address/${a.provider}`} target="_blank" rel="noreferrer" style={{ color: "var(--p-muted)" }}>
              Provider {shortAddress(a.provider)} <ExternalLink size={10} style={{ verticalAlign: "baseline" }} />
            </a>
            <span className="p-folio" style={{ color: "var(--p-muted)" }} title={a.customer}>
              Customer {shortAddress(a.customer)}
            </span>
          </div>
        </div>

        <div className="p-case-grid p-enter p-enter-1">
          {/* ------------------------------------------------ left column */}
          <div style={{ display: "grid", gap: 22 }}>
            <div className="p-panel">
              <div className="p-panel-head">
                <span>Frozen terms</span>
                <span>spec sealed</span>
              </div>
              <div className="p-panel-body">
                <Ledger
                  rows={[
                    ["Service", a.service_name],
                    ["Service URL", <a href={a.service_url} target="_blank" rel="noreferrer" style={{ color: "var(--p-accent-dark)" }}>{a.service_url}</a>],
                    ["Metric", a.metric_name],
                    ["Availability target", bpsToPercent(a.target_bps)],
                    ["Maximum credit", `${formatGenAmount(a.max_credit_atto)} GEN`],
                    ["Provider bond", `${formatGenAmount(a.bond_atto)} GEN`],
                    ["Coverage window", `${formatTimestamp(a.window_start)} — ${formatTimestamp(a.window_end)}`],
                    ["Formation deadline", `${formatTimestamp(a.formation_deadline)}${formationOpen ? ` · ${relativeRemaining(a.formation_deadline)}` : ""}`],
                    ["Challenge window", `${Math.round(Number(a.challenge_window_seconds) / 60)} minutes after each decision`],
                    ["Sealed", formatTimestamp(a.created_at)],
                    ["Accepted", formatTimestamp(a.accepted_at)],
                  ]}
                />
              </div>
            </div>

            <div className="p-panel">
              <div className="p-panel-head">
                <span>Frozen exception clauses</span>
                <span>{a.exceptions.length} sealed</span>
              </div>
              <div className="p-panel-body" style={{ paddingTop: 14 }}>
                {a.exceptions.map((clause) => (
                  <div className="p-clause" key={clause.code}>
                    <b>{clause.code}</b>
                    <strong>{clause.title}</strong>
                    <p>{clause.rule}</p>
                    <small>Proof required — {clause.proof}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-panel">
              <div className="p-panel-head">
                <span>Source policy</span>
                <span>origins frozen</span>
              </div>
              <div className="p-panel-body">
                {(["measurement", "exception", "challenge"] as const).map((group) => (
                  <div key={group} style={{ marginBottom: 14 }}>
                    <span className="p-folio" style={{ color: "var(--p-muted)" }}>{group}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {a.source_policy[group].map((entry) => (
                        <span className="p-chip" key={entry.host + entry.kind} title={`${entry.host}${entry.path_prefix} · ${entry.retrieval_mode.replace(/_/g, " ").toLowerCase()}`}>
                          <i />
                          {entry.host}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p style={{ color: "var(--p-muted)", fontSize: 12, margin: "10px 0 0" }}>
                  Evidence from any other origin is rejected on submission. Retrieval modes are frozen per origin —
                  hover an origin chip to see the mode bound to it.
                </p>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------- right column */}
          <div style={{ display: "grid", gap: 22 }}>
            <div className="p-panel">
              <div className="p-panel-head">
                <span>Case timeline</span>
                <span>{i ? idToDisplay(i.id) : "no incident"}</span>
              </div>
              <div className="p-panel-body">
                <div className="p-timeline">
                  <div className={`time-item ${a.status !== "PROPOSED" ? "is-done" : "is-live"}`}>
                    <b>Pact sealed by provider</b>
                    <small>{formatTimestamp(a.created_at)} · bond escrowed</small>
                  </div>
                  <div className={`time-item ${a.accepted_at !== "0" ? "is-done" : a.status === "PROPOSED" ? "is-live" : ""}`}>
                    <b>Customer acceptance</b>
                    <small>{a.accepted_at !== "0" ? formatTimestamp(a.accepted_at) : formationOpen ? `open · ${relativeRemaining(a.formation_deadline)}` : "formation lapsed"}</small>
                  </div>
                  <div className={`time-item ${i ? "is-done" : a.status === "ACTIVE" ? "is-live" : ""}`}>
                    <b>Incident opened</b>
                    <small>{i ? `${formatTimestamp(i.opened_at)} · claimed ${bpsToPercent(i.claimed_actual_bps)} observed availability` : "coverage window runs"}</small>
                  </div>
                  <div className={`time-item ${i && i.measurement_verified_at !== "0" ? "is-done" : i && i.status.startsWith("MEASUREMENT") ? "is-live" : ""}`}>
                    <b>Measurement consensus</b>
                    <small>
                      {i && i.measurement_verified_at !== "0"
                        ? `verified ${bpsToPercent(i.actual_bps)} at ${formatTimestamp(i.measurement_verified_at)}`
                        : i
                          ? i.status.replace(/_/g, " ").toLowerCase()
                          : "awaiting incident"}
                    </small>
                  </div>
                  <div className={`time-item ${i?.exception_code ? "is-done" : i?.status === "OPEN" ? "is-live" : ""}`}>
                    <b>Exception claimed</b>
                    <small>{i?.exception_code ? `clause ${i.exception_code} under review` : i?.status === "OPEN" ? `provider window · ${relativeRemaining(i.response_deadline)}` : "—"}</small>
                  </div>
                  <div className={`time-item ${i && i.finalized_at !== "0" ? "is-done" : i?.status === "PENDING" ? "is-live" : ""}`}>
                    <b>Settlement</b>
                    <small>
                      {i && i.finalized_at !== "0"
                        ? `final · customer payout ${formatGenAmount(i.payout_atto || "0")} GEN`
                        : i?.status === "PENDING"
                          ? `challenge window · ${relativeRemaining(i.challenge_deadline)}`
                          : "—"}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {i ? (
              <div className="p-panel">
                <div className="p-panel-head">
                  <span>Incident {idToDisplay(i.id)}</span>
                  <StatusChip status={i.status} />
                </div>
                {i.status === "PENDING" || i.status === "FINAL" ? (
                  <div className="p-results-bar">
                    <div>
                      <b>Adjudicated outcome</b>
                      <strong>{i.exception_result.replace(/_/g, " ").toLowerCase()}</strong>
                    </div>
                    <div>
                      <b>Liability share</b>
                      <strong>{bpsToPercent(i.liable_bps)}</strong>
                    </div>
                    <div>
                      <b>Customer payout</b>
                      <strong>{formatGenAmount(i.payout_atto || "0")} GEN</strong>
                    </div>
                  </div>
                ) : null}
                <div className="p-panel-body">
                  <Ledger
                    rows={[
                      ["Observation window", `${formatTimestamp(i.observed_from)} — ${formatTimestamp(i.observed_to)}`],
                      ["Claimed availability", bpsToPercent(i.claimed_actual_bps)],
                      ["Consensus-measured", i.measurement_verified_at !== "0" ? bpsToPercent(i.actual_bps) : "not decided"],
                      ["Measurement basis", i.measurement_basis || "—"],
                      ["Exception clause", i.exception_code || "—"],
                      ["Finding basis", i.basis || "—"],
                      ...(challenge
                        ? ([
                            ["Challenge", `${challenge.status.replace(/_/g, " ").toLowerCase()} · bonded ${formatGenAmount(challenge.bond_atto)} GEN`],
                            ["Challenge basis", challenge.basis || "—"],
                          ] as Array<[string, React.ReactNode]>)
                        : []),
                    ]}
                  />
                </div>
              </div>
            ) : null}

            {/* ------------------------------------------------- actions */}
            <div className="p-panel">
              <div className="p-panel-head">
                <span>Case actions</span>
                <span>{wallet.connected ? `acting as ${shortAddress(wallet.address || "")}` : "connect a Studionet wallet to act"}</span>
              </div>
              <div className="p-panel-body" style={{ paddingTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 }}>
                  {[
                    { icon: FilePen, label: "Formation" },
                    { icon: Radar, label: "Measurement" },
                    { icon: Gavel, label: "Adjudication" },
                    { icon: Landmark, label: "Settlement" },
                  ].map((stage) => (
                    <span key={stage.label} className="p-chip" style={{ justifyContent: "center", padding: "10px 8px" }}>
                      <stage.icon size={13} strokeWidth={1.7} style={{ color: "var(--p-accent-dark)" }} />
                      {stage.label}
                    </span>
                  ))}
                </div>

                <ActionBox
                  title="Accept this pact"
                  body="You are the named customer and formation is still open. Acceptance activates coverage immediately."
                  actionLabel="Sign acceptance"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!(isCustomer && formationOpen)}
                  onRun={() => action.run("accept_agreement", [id])}
                />

                <ActionBox
                  title="Reclaim the proposal bond"
                  body="Formation lapsed without acceptance. Anyone may expire the proposal; the bond returns to the provider as credit."
                  actionLabel="Expire proposal"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!(a.status === "PROPOSED" && nowSeconds >= Number(a.formation_deadline))}
                  onRun={() => action.run("expire_proposal", [id])}
                />

                <ActionBox
                  title="Close the coverage window"
                  body="The window ended without an incident. Anyone may expire the pact; the full bond returns to the provider."
                  actionLabel="Expire agreement"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!(a.status === "ACTIVE" && !a.incident_id && nowSeconds > Number(a.window_end))}
                  onRun={() => action.run("expire_agreement", [id])}
                />

                {isCustomer && a.status === "ACTIVE" && !a.incident_id ? (
                  <div className="p-action">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <b>Open an incident</b>
                      <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={loadSampleIncident}>
                        <Sparkles size={12} /> Load sample incident
                      </button>
                    </div>
                    <p>
                      Report a completed observation window. The claimed availability must sit below the frozen target,
                      and measurement evidence must come from the frozen origins — including the independent probe.
                    </p>
                    {incidentSampled ? (
                      <div className="p-notice p-notice-warn" style={{ margin: "0 0 14px" }}>
                        <span>
                          Sample values are loaded for testing. Check and replace every illustrative URL and note with
                          real public evidence before signing — the chain validates origins, families and wording.
                        </span>
                      </div>
                    ) : null}
                    {!observationPossible ? (
                      <div className="p-notice p-notice-warn" style={{ margin: "0 0 14px" }}>
                        <span>
                          Coverage starts {formatTimestamp(a.window_start)}. Only completed intervals can be reported —
                          the earliest observation can end one minute after coverage begins.
                        </span>
                      </div>
                    ) : null}
                    <div className="p-two">
                      <div className="p-field">
                        <label>Observed availability (basis points)</label>
                        <input inputMode="numeric" placeholder="e.g. 9850 for 98.50%" value={actualBps} onChange={(e) => setActualBps(e.target.value)} />
                      </div>
                      <div className="p-field">
                        <label>Target is {bpsToPercent(a.target_bps)}</label>
                        <input disabled value={`Claim must be below ${a.target_bps} bps`} />
                      </div>
                    </div>
                    <div className="p-two">
                      <div className="p-field">
                        <label>Observation starts</label>
                        <input
                          type="datetime-local"
                          min={obsMinInput}
                          max={obsMaxInput}
                          value={obsFromInput}
                          onChange={(e) => setObsFrom(e.target.value)}
                        />
                        <span className="p-hint">Inside the frozen coverage window.</span>
                      </div>
                      <div className="p-field">
                        <label>Observation ends</label>
                        <input
                          type="datetime-local"
                          min={obsMinInput}
                          max={obsMaxInput}
                          value={obsToInput}
                          onChange={(e) => setObsTo(e.target.value)}
                        />
                        <span className="p-hint">Must already have happened — the chain rejects future times.</span>
                      </div>
                    </div>
                    <EvidenceEditor
                      group="Measurement"
                      kinds={measurementKinds}
                      items={effectiveMEvidence}
                      onChange={setMEvidence}
                    />
                    <div style={{ display: "grid", gap: 7, margin: "2px 0 14px" }}>
                      {[
                        { ok: actualOk, label: `availability claim below the ${a.target_bps} bps target` },
                        { ok: observationContained, label: "observation window completed and inside coverage" },
                        { ok: evidenceOk, label: "two frozen measurement sources with HTTPS URL and note" },
                      ].map((item) => (
                        <span
                          key={item.label}
                          className="p-hint"
                          style={{ display: "flex", alignItems: "center", gap: 9, color: item.ok ? "var(--p-accent-dark)" : "var(--p-muted)" }}
                        >
                          <i style={{ width: 7, height: 7, flex: "none", background: item.ok ? "var(--p-accent-dark)" : "var(--p-line)" }} />
                          {item.ok ? "Ready" : "Missing"} — {item.label}
                        </span>
                      ))}
                    </div>
                    <button
                      className="p-btn p-btn-sm"
                      style={{ width: "100%", minHeight: 48 }}
                      disabled={action.busy || !openIncidentReady}
                      onClick={submitOpenIncident}
                    >
                      {action.busy && <span className="p-spin" />}
                      Submit incident
                    </button>
                    <TxNotice state={action.state} />
                  </div>
                ) : null}

                <ActionBox
                  title="Run measurement consensus"
                  body="Validators fetch every frozen measurement source and vote on whether the miss is corroborated. Anyone may trigger."
                  actionLabel="Verify measurement"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!i || !["MEASUREMENT_PENDING", "MEASUREMENT_INCONCLUSIVE"].includes(i.status)}
                  onRun={() => action.run("verify_measurement", [i!.id])}
                />

                <ActionBox
                  title="Dismiss an unproven measurement"
                  body="Evidence stayed unavailable through the bounded retry window. Dismissing unblocks the pact without a breach."
                  actionLabel="Dismiss measurement"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!i || i.status !== "MEASUREMENT_INCONCLUSIVE" || nowSeconds < Number(i.measurement_deadline)}
                  onRun={() => action.run("dismiss_unproven_measurement", [i!.id])}
                />

                {i && isProvider && i.status === "OPEN" && nowSeconds < Number(i.response_deadline) ? (
                  <div className="p-action">
                    <b>Claim a frozen exception</b>
                    <p>
                      The miss is verified. Point to exactly one sealed clause and evidence from the frozen exception
                      origins — {relativeRemaining(i.response_deadline)}.
                    </p>
                    <div className="p-field">
                      <label>Exception clause</label>
                      <select value={claimCode} onChange={(e) => setClaimCode(e.target.value)}>
                        <option value="">Choose a sealed clause…</option>
                        {a.exceptions.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <EvidenceEditor
                      group="Exception"
                      kinds={exceptionKinds}
                      items={effectiveXEvidence}
                      onChange={setXEvidence}
                    />
                    <button
                      className="p-btn p-btn-sm"
                      disabled={action.busy || !claimReady}
                      onClick={submitClaim}
                    >
                      {action.busy && <span className="p-spin" />}
                      Submit exception claim
                    </button>
                    {!claimReady ? (
                      <span className="p-hint" style={{ display: "block", marginTop: 10 }}>
                        To enable submission choose a sealed clause and give each source an HTTPS URL plus a read note.
                      </span>
                    ) : null}
                    <TxNotice state={action.state} />
                  </div>
                ) : null}

                <ActionBox
                  title="Adjudicate the exception"
                  body="Consensus decides whether the evidence establishes the exact frozen clause and derives excusable intervals — percentages are computed by code."
                  actionLabel="Adjudicate"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!i || !["EXCEPTION_CLAIMED", "INCONCLUSIVE"].includes(i.status)}
                  onRun={() => action.run("adjudicate_exception", [i!.id])}
                />

                {i && isParty && i.status === "PENDING" && nowSeconds < Number(i.challenge_deadline) && !i.challenge ? (
                  <div className="p-action">
                    <b>Challenge the pending finding</b>
                    <p>
                      Bond a stake and cite one source from the frozen challenge origins. If the finding stands, the
                      bond goes to the counterparty — {relativeRemaining(i.challenge_deadline)}.
                    </p>
                    <div className="p-field">
                      <label>Challenge statement</label>
                      <textarea placeholder="State the factual or contractual error you allege…" value={challengeText} onChange={(e) => setChallengeText(e.target.value)} />
                    </div>
                    <div className="p-two">
                      <div className="p-field">
                        <label>Evidence URL (challenge origin)</label>
                        <input placeholder="https://…" value={challengeUrl} onChange={(e) => setChallengeUrl(e.target.value)} />
                      </div>
                      <div className="p-field">
                        <label>Bond (GEN · 0.0001–10)</label>
                        <input inputMode="decimal" placeholder="0.05" value={challengeStake} onChange={(e) => setChallengeStake(e.target.value)} />
                        <span className="p-hint">Outside the protocol range the chain refuses the stake.</span>
                      </div>
                    </div>
                    <button
                      className="p-btn p-btn-sm"
                      disabled={action.busy || !challengeReady}
                      onClick={submitChallenge}
                    >
                      {action.busy && <span className="p-spin" />}
                      Post bonded challenge
                    </button>
                    <TxNotice state={action.state} />
                  </div>
                ) : null}

                <ActionBox
                  title="Resolve the challenge"
                  body="Consensus re-fetches every original source plus the challenge source and either revises the finding or rejects the challenge."
                  actionLabel="Resolve challenge"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!challenge || challenge.status !== "OPEN"}
                  onRun={() => action.run("resolve_challenge", [i!.id])}
                />

                <ActionBox
                  title="Expire a stalled challenge"
                  body="No decisive challenge result inside the bounded window — the bond returns and the pending judgment may finalize."
                  actionLabel="Expire challenge"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!challenge || challenge.status !== "OPEN" || nowSeconds < Number(challenge.resolution_deadline)}
                  onRun={() => action.run("expire_challenge", [i!.id])}
                />

                <ActionBox
                  title="Finalize the incident"
                  body="The challenge window has closed. Settlement pays the customer share of coverage from liability and returns the remainder."
                  actionLabel="Finalize & settle"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={!i || i.status !== "PENDING" || nowSeconds < Number(i.challenge_deadline) || (challenge?.status === "OPEN")}
                  onRun={() => action.run("finalize_incident", [i!.id])}
                />

                <ActionBox
                  title="Finalize by default"
                  body="A verified miss went unanswered past the response window (or evidence stayed unavailable through retries). The default rules settle the bond."
                  actionLabel="Settle by default"
                  busy={action.busy}
                  tx={<TxNotice state={action.state} />}
                  done={
                    !i ||
                    !(
                      (i.status === "OPEN" && nowSeconds >= Number(i.response_deadline)) ||
                      (i.status === "INCONCLUSIVE" && nowSeconds >= Number(i.resolution_deadline))
                    )
                  }
                  onRun={() => action.run("finalize_default_breach", [i!.id])}
                />

                {a.status === "PROPOSED" && formationOpen && !isCustomer ? (
                  <p style={{ color: "var(--p-muted)", fontSize: 12.5, margin: "16px 0 0" }}>
                    Only the named customer ({shortAddress(a.customer)}) can accept while formation is open.
                  </p>
                ) : null}
                {a.status === "ACTIVE" && !a.incident_id && !isCustomer ? (
                  <p style={{ color: "var(--p-muted)", fontSize: 12.5, margin: "16px 0 0" }}>
                    Coverage is live. Only the customer may open an incident; keeper actions unlock after one exists.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="p-panel">
              <div className="p-panel-body" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Check size={16} style={{ color: "var(--p-accent-dark)", flex: "none", marginTop: 2 }} />
                <p style={{ margin: 0, color: "var(--p-muted)", fontSize: 12.5, lineHeight: 1.7 }}>
                  Every action above is a signed write on Studionet 61999. Signing, consensus stages and finality are
                  reported beside the action; nothing executes locally. Keeper actions are permissionless — the same
                  on-chain guards apply to every caller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
