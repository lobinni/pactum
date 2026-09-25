import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, FilePlus2, Sparkles, Trash2 } from "lucide-react";
import Kicker from "../components/Kicker";
import TxNotice from "../components/TxNotice";
import { useAction } from "../lib/useAction";
import { useWallet } from "../components/WalletContext";
import { IS_DEPLOYED } from "../lib/config";
import { parseGenAmount } from "../lib/amount";

const MEASUREMENT_KINDS = ["INDEPENDENT_PROBE", "STATUS_AGGREGATOR", "PUBLIC_TELEMETRY", "PROVIDER_STATUS"];
const EXTENDED_KINDS = [
  ...MEASUREMENT_KINDS,
  "OFFICIAL_STATUS",
  "INDEPENDENT_TIMELINE",
  "UPSTREAM_STATUS",
  "COUNTER_EVIDENCE",
  "PUBLIC_NOTICE",
  "PUBLIC_SOURCE",
];
const RETRIEVAL_MODES = ["RENDER_TEXT", "REQUEST_JSON", "REQUEST_TEXT"];

interface ClauseDraft {
  code: string;
  title: string;
  rule: string;
  proof: string;
}

interface PolicyDraft {
  kind: string;
  host: string;
  path_prefix: string;
  retrieval_mode: string;
}

interface FormDraft {
  customer: string;
  service: string;
  url: string;
  metric: string;
  target: string; // percent, e.g. "99.95"
  credit: string; // GEN
  startAfterMinutes: string;
  durationMinutes: string;
  challengeMinutes: string;
  policy: string;
  clauses: ClauseDraft[];
  measurement: PolicyDraft[];
  exception: PolicyDraft[];
  challenge: PolicyDraft[];
}

const BLANK_CLAUSE: ClauseDraft = { code: "", title: "", rule: "", proof: "" };
const blankPolicy = (group: "measurement" | "exception" | "challenge"): PolicyDraft => ({
  kind: group === "measurement" ? MEASUREMENT_KINDS[0] : "PUBLIC_SOURCE",
  host: "",
  path_prefix: "/",
  retrieval_mode: "RENDER_TEXT",
});

function emptyDraft(): FormDraft {
  return {
    customer: "",
    service: "",
    url: "",
    metric: "",
    target: "99.90",
    credit: "1",
    startAfterMinutes: "1440",
    durationMinutes: "43200",
    challengeMinutes: "60",
    policy: "",
    clauses: [{ ...BLANK_CLAUSE }],
    measurement: [blankPolicy("measurement")],
    exception: [blankPolicy("exception")],
    challenge: [blankPolicy("challenge")],
  };
}

function sampleDraft(): FormDraft {
  return {
    customer: "0x0000000000000000000000000000000000000001",
    service: "Northbeam Edge API (illustrative — replace before signing)",
    url: "https://status.northbeam.example.com",
    metric: "Monthly service availability",
    target: "99.90",
    credit: "0.01",
    startAfterMinutes: "1440",
    durationMinutes: "43200",
    challengeMinutes: "120",
    policy:
      "Use only evidence from the frozen origins below. A status notice alone does not establish an exception; evidence must match the named service and the completed observation window. Unavailable or inconclusive evidence never excuses a miss.",
    clauses: [
      {
        code: "UPSTREAM",
        title: "Upstream infrastructure failure",
        rule: "A documented failure of a named hosting dependency materially caused the service impact during the frozen window.",
        proof: "Public incident records from the dependency describing start and end times overlapping the observation.",
      },
    ],
    measurement: [
      { kind: "INDEPENDENT_PROBE", host: "probe.watchline.example.org", path_prefix: "/", retrieval_mode: "REQUEST_JSON" },
      { kind: "STATUS_AGGREGATOR", host: "statusroll.example.net", path_prefix: "/", retrieval_mode: "RENDER_TEXT" },
    ],
    exception: [{ kind: "UPSTREAM_STATUS", host: "status.hostgrid.example.io", path_prefix: "/", retrieval_mode: "REQUEST_TEXT" }],
    challenge: [{ kind: "PUBLIC_SOURCE", host: "journal.example.com", path_prefix: "/", retrieval_mode: "RENDER_TEXT" }],
  };
}

function PolicyGroupEditor({
  title,
  group,
  items,
  kinds,
  onChange,
}: {
  title: string;
  group: "measurement" | "exception" | "challenge";
  items: PolicyDraft[];
  kinds: string[];
  onChange: (items: PolicyDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<PolicyDraft>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="p-folio">{title}</span>
        <button
          type="button"
          className="p-btn p-btn-ghost p-btn-sm"
          disabled={items.length >= 8}
          onClick={() => onChange([...items, blankPolicy(group)])}
        >
          <FilePlus2 size={12} /> Add origin
        </button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, index) => (
          <div key={index} className="p-panel" style={{ padding: 14, borderStyle: "dashed" }}>
            <div className="p-two">
              <div className="p-field" style={{ marginBottom: 10 }}>
                <label>Family</label>
                <select value={item.kind} onChange={(e) => update(index, { kind: e.target.value })}>
                  {kinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replace(/_/g, " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-field" style={{ marginBottom: 10 }}>
                <label>Public host (no protocol)</label>
                <input placeholder="status.example.com" value={item.host} onChange={(e) => update(index, { host: e.target.value })} />
              </div>
            </div>
            <div className="p-two" style={{ alignItems: "end" }}>
              <div className="p-field" style={{ marginBottom: 0 }}>
                <label>Path prefix</label>
                <input placeholder="/" value={item.path_prefix} onChange={(e) => update(index, { path_prefix: e.target.value })} />
              </div>
              <div className="p-field" style={{ marginBottom: 0 }}>
                <label>Retrieval mode</label>
                <select value={item.retrieval_mode} onChange={(e) => update(index, { retrieval_mode: e.target.value })}>
                  {RETRIEVAL_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode.replace(/_/g, " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="p-btn p-btn-ghost p-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Open() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<FormDraft>(emptyDraft());
  const [sampled, setSampled] = useState(false);
  const [formError, setFormError] = useState("");
  const action = useAction();

  const patch = (part: Partial<FormDraft>) => setDraft((d) => ({ ...d, ...part }));

  const targetBps = useMemo(() => {
    const percent = Number(draft.target);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return 0;
    return Math.round(percent * 100);
  }, [draft.target]);

  const measurementsValid = (() => {
    if (
      draft.measurement.length < 2 ||
      new Set(draft.measurement.map((x) => x.kind)).size < 2 ||
      !draft.measurement.every((x) => x.host.trim().length > 3)
    ) {
      return false;
    }
    const probe = draft.measurement.find((x) => x.kind === "INDEPENDENT_PROBE");
    if (!probe) return false;
    const probeHost = probe.host.trim().toLowerCase();
    const tail = (host: string) => host.split(".").slice(-2).join(".");
    const serviceHost = draft.url.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    // Mirrors the on-chain guards: the probe must live outside the service
    // domain and cannot share the provider-status origin.
    if (serviceHost && (tail(probeHost) === tail(serviceHost) || probeHost.endsWith("." + serviceHost) || serviceHost.endsWith("." + probeHost))) {
      return false;
    }
    if (draft.measurement.some((x) => x.kind === "PROVIDER_STATUS" && x.host.trim().toLowerCase() === probeHost)) {
      return false;
    }
    return true;
  })();

  const hostsValid = (items: PolicyDraft[]) => {
    const hosts = items.map((x) => x.host.trim().toLowerCase());
    return (
      items.length >= 1 &&
      new Set(hosts).size === hosts.length &&
      items.every((x) => /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(x.host.trim()) && x.path_prefix.startsWith("/"))
    );
  };

  const clauseCodesValid = (() => {
    const codes = draft.clauses.map((c) => c.code.trim().toUpperCase());
    return codes.every((c) => /^[A-Z0-9_-]{1,20}$/.test(c)) && new Set(codes).size === codes.length;
  })();

  const canSubmit = useMemo(() => {
    if (!IS_DEPLOYED) return false;
    if (!/^0x[0-9a-fA-F]{40}$/.test(draft.customer.trim())) return false;
    if (draft.service.trim().length < 3 || !draft.url.startsWith("https://") || draft.metric.trim().length < 3) return false;
    if (targetBps < 1 || targetBps > 10000) return false;
    try {
      const atto = parseGenAmount(draft.credit);
      if (atto < 10n ** 15n || atto > 50n * 10n ** 18n) return false;
    } catch {
      return false;
    }
    if (Number(draft.startAfterMinutes) < 12 || Number(draft.durationMinutes) < 30) return false;
    const challenge = Number(draft.challengeMinutes);
    if (!(challenge >= 10 && challenge <= 1440)) return false;
    if (!measurementsValid || !hostsValid(draft.measurement) || !hostsValid(draft.exception) || !hostsValid(draft.challenge)) return false;
    if (!clauseCodesValid) return false;
    if (draft.clauses.some((c) => c.title.trim().length < 3 || c.rule.trim().length < 12 || c.proof.trim().length < 8)) return false;
    if (draft.policy.trim().length < 12) return false;
    return true;
  }, [draft, targetBps, measurementsValid]);

  const submit = async () => {
    setFormError("");
    try {
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now + Math.max(12, Number(draft.startAfterMinutes)) * 60;
      const windowEnd = windowStart + Math.max(30, Number(draft.durationMinutes)) * 60;
      const creditAtto = parseGenAmount(draft.credit);
      const exceptions = draft.clauses.map((c) => ({
        code: c.code.trim().toUpperCase(),
        title: c.title.trim(),
        rule: c.rule.trim(),
        proof: c.proof.trim(),
      }));
      const sourcePolicy = {
        measurement: draft.measurement.map(({ kind, host, path_prefix, retrieval_mode }) => ({ kind, host: host.trim().toLowerCase(), path_prefix, retrieval_mode })),
        exception: draft.exception.map(({ kind, host, path_prefix, retrieval_mode }) => ({ kind, host: host.trim().toLowerCase(), path_prefix, retrieval_mode })),
        challenge: draft.challenge.map(({ kind, host, path_prefix, retrieval_mode }) => ({ kind, host: host.trim().toLowerCase(), path_prefix, retrieval_mode })),
      };
      const ok = await action.run(
        "create_agreement",
        [
          draft.customer.trim(),
          draft.service.trim(),
          draft.url.trim(),
          draft.metric.trim(),
          targetBps,
          creditAtto,
          windowStart,
          windowEnd,
          JSON.stringify(exceptions),
          draft.policy.trim(),
          JSON.stringify(sourcePolicy),
          Math.round(Number(draft.challengeMinutes) * 60),
        ],
        creditAtto,
      );
      if (ok) navigate("/agreements");
    } catch (e: any) {
      setFormError(e?.message ? String(e.message).slice(0, 220) : "Check the form values");
    }
  };

  return (
    <div className="p-page">
      <section className="p-shell p-zone" style={{ paddingTop: 56 }}>
        <div className="zone-head p-enter">
          <div>
            <Kicker>Formation · provider side</Kicker>
            <h1 style={{ marginTop: 20 }}>
              New
              <br />
              Agreement<span>.</span>
            </h1>
          </div>
          <p>
            You are the provider: your bond covers the maximum credit and escrows at signing. Everything you write
            here freezes — terms, clauses and evidence origins can never be edited afterwards.
          </p>
        </div>

        <div className="p-case-grid p-enter p-enter-1">
          {/* ------------------------------------------------------- form */}
          <div className="p-panel">
            <div className="p-panel-head">
              <span>Terms sheet</span>
              <span>{sampled ? "sample loaded · review every value" : "starts blank"}</span>
            </div>
            <div className="p-panel-body">
              <div className="p-two">
                <div className="p-field">
                  <label>Customer wallet address</label>
                  <input placeholder="0x…" value={draft.customer} onChange={(e) => patch({ customer: e.target.value })} />
                </div>
                <div className="p-field">
                  <label>Service name</label>
                  <input placeholder="Northbeam Edge API" value={draft.service} onChange={(e) => patch({ service: e.target.value })} />
                </div>
              </div>
              <div className="p-two">
                <div className="p-field">
                  <label>Service URL (HTTPS)</label>
                  <input placeholder="https://status.example.com" value={draft.url} onChange={(e) => patch({ url: e.target.value })} />
                </div>
                <div className="p-field">
                  <label>Measured metric</label>
                  <input placeholder="Monthly service availability" value={draft.metric} onChange={(e) => patch({ metric: e.target.value })} />
                </div>
              </div>
              <div className="p-two">
                <div className="p-field">
                  <label>Availability target (%)</label>
                  <input inputMode="decimal" value={draft.target} onChange={(e) => patch({ target: e.target.value })} />
                  <span className="p-hint">Frozen as {targetBps} basis points. Breach = measured below target.</span>
                </div>
                <div className="p-field">
                  <label>Maximum credit · equal to provider bond (GEN)</label>
                  <input inputMode="decimal" value={draft.credit} onChange={(e) => patch({ credit: e.target.value })} />
                  <span className="p-hint">Between 0.001 and 50 GEN. Escrowed in full at signing.</span>
                </div>
              </div>
              <div className="p-two">
                <div className="p-field">
                  <label>Coverage starts in (minutes · 12 minimum)</label>
                  <input inputMode="numeric" value={draft.startAfterMinutes} onChange={(e) => patch({ startAfterMinutes: e.target.value })} />
                  <span className="p-hint">Formation needs a signed-acceptance lead; the chain refuses starts under 10 minutes.</span>
                </div>
                <div className="p-field">
                  <label>Coverage lasts (minutes)</label>
                  <input inputMode="numeric" value={draft.durationMinutes} onChange={(e) => patch({ durationMinutes: e.target.value })} />
                </div>
              </div>
              <div className="p-field">
                <label>Challenge window after each decision (minutes · 10–1440)</label>
                <input inputMode="numeric" value={draft.challengeMinutes} onChange={(e) => patch({ challengeMinutes: e.target.value })} />
              </div>
              <div className="p-field">
                <label>Evidence policy — instructions validators must follow</label>
                <textarea
                  placeholder="Describe what counts as decisive evidence, how stale or unattributable sources are treated, and the standard for excusing a miss…"
                  value={draft.policy}
                  onChange={(e) => patch({ policy: e.target.value })}
                />
              </div>

              <div className="p-action" style={{ marginTop: 6 }}>
                <b>Frozen exception clauses</b>
                <p>Only these exact clauses can ever be claimed. Use short uppercase codes.</p>
                {draft.clauses.map((clause, index) => (
                  <div key={index} className="p-clause" style={{ background: "var(--p-paper)" }}>
                    <div className="p-two">
                      <div className="p-field" style={{ marginBottom: 8 }}>
                        <label>Code</label>
                        <input placeholder="UPSTREAM" value={clause.code} onChange={(e) => patch({ clauses: draft.clauses.map((c, i) => (i === index ? { ...c, code: e.target.value.toUpperCase() } : c)) })} />
                      </div>
                      <div className="p-field" style={{ marginBottom: 8 }}>
                        <label>Title</label>
                        <input placeholder="Upstream infrastructure failure" value={clause.title} onChange={(e) => patch({ clauses: draft.clauses.map((c, i) => (i === index ? { ...c, title: e.target.value } : c)) })} />
                      </div>
                    </div>
                    <div className="p-field" style={{ marginBottom: 8 }}>
                      <label>Clause rule</label>
                      <textarea style={{ minHeight: 70 }} value={clause.rule} onChange={(e) => patch({ clauses: draft.clauses.map((c, i) => (i === index ? { ...c, rule: e.target.value } : c)) })} />
                    </div>
                    <div className="p-field" style={{ marginBottom: 0 }}>
                      <label>Proof required</label>
                      <input value={clause.proof} onChange={(e) => patch({ clauses: draft.clauses.map((c, i) => (i === index ? { ...c, proof: e.target.value } : c)) })} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button type="button" className="p-btn p-btn-ghost p-btn-sm" disabled={draft.clauses.length >= 8} onClick={() => patch({ clauses: [...draft.clauses, { ...BLANK_CLAUSE }] })}>
                    <FilePlus2 size={12} /> Add clause
                  </button>
                  {draft.clauses.length > 1 && (
                    <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={() => patch({ clauses: draft.clauses.slice(0, -1) })}>
                      <Trash2 size={12} /> Remove last
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- policy */}
          <div style={{ display: "grid", gap: 22 }}>
            <div className="p-panel">
              <div className="p-panel-head">
                <span>Frozen evidence origins</span>
                <span>three groups</span>
              </div>
              <div className="p-panel-body">
                <PolicyGroupEditor
                  title="Measurement origins — need 2+ families incl. an independent probe"
                  group="measurement"
                  kinds={MEASUREMENT_KINDS}
                  items={draft.measurement}
                  onChange={(measurement) => patch({ measurement })}
                />
                <PolicyGroupEditor
                  title="Exception origins"
                  group="exception"
                  kinds={EXTENDED_KINDS}
                  items={draft.exception}
                  onChange={(exception) => patch({ exception })}
                />
                <PolicyGroupEditor
                  title="Challenge origins"
                  group="challenge"
                  kinds={EXTENDED_KINDS}
                  items={draft.challenge}
                  onChange={(challenge) => patch({ challenge })}
                />
              </div>
            </div>

            <div className="p-panel">
              <div className="p-panel-body" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <CircleAlert size={15} style={{ flex: "none", marginTop: 2, color: "var(--p-accent-dark)" }} />
                  <p style={{ margin: 0, color: "var(--p-muted)", fontSize: 12.5, lineHeight: 1.7 }}>
                    Prefer stable, non-redirecting source URLs. An independent probe must live outside the service
                    domain. Any evidence URL submitted later must sit under one of these frozen origins.
                  </p>
                </div>
                <button
                  type="button"
                  className="p-btn p-btn-ghost p-btn-sm"
                  style={{ justifySelf: "start" }}
                  onClick={() => {
                    setDraft(sampleDraft());
                    setSampled(true);
                  }}
                >
                  <Sparkles size={12} /> Load sample agreement
                </button>
                <p style={{ margin: 0, color: "var(--p-muted)", fontSize: 12, lineHeight: 1.6 }}>
                  Loading the sample is an explicit opt-in. Every illustrative value must be checked and replaced
                  before a real proposal.
                </p>
              </div>
            </div>

            <div className="p-panel">
              <div className="p-panel-head">
                <span>Seal the pact</span>
                <span>{wallet.connected ? "wallet ready" : "connect on 61999"}</span>
              </div>
              <div className="p-panel-body">
                <button className="p-btn" style={{ width: "100%" }} disabled={!canSubmit || action.busy} onClick={submit}>
                  {action.busy && <span className="p-spin" />}
                  {!IS_DEPLOYED
                    ? "Awaiting canonical deployment"
                    : wallet.connected
                      ? <>Sign and escrow bond <ArrowRight size={13} /></>
                      : "Connect wallet to seal"}
                </button>
                {formError ? (
                  <div className="p-notice p-notice-danger" style={{ marginTop: 14 }}>
                    <CircleAlert size={13} />
                    <span>{formError}</span>
                  </div>
                ) : null}
                <TxNotice state={action.state} />
                {!canSubmit && IS_DEPLOYED ? (
                  <p style={{ margin: "12px 0 0", color: "var(--p-muted)", fontSize: 11.5, lineHeight: 1.6 }}>
                    The seal unlocks when the terms validate: customer address, HTTPS service URL, target within
                    range, bond 0.001–50 GEN, a probe-backed measurement policy, complete clauses and policy text.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
