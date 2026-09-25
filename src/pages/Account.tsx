import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Banknote, Gauge, RefreshCcw, ShieldCheck, Wallet } from "lucide-react";
import Kicker from "../components/Kicker";
import StatusChip from "../components/StatusChip";
import TxNotice from "../components/TxNotice";
import { useWallet } from "../components/WalletContext";
import { getCredit, getStats, listAgreements, listIncidents } from "../lib/contract";
import { useAction } from "../lib/useAction";
import { useRead } from "../lib/useRead";
import { formatGenAmount } from "../lib/amount";
import { bpsToPercent, idToDisplay, plural, shortAddress } from "../lib/format";
import { formatTimestamp } from "../lib/time";
import type { Agreement, Incident, ProtocolStats } from "../lib/types";

export default function Account() {
  const wallet = useWallet();
  const statsRead = useRead(() => getStats(), []);
  const stats: ProtocolStats | null = statsRead.data;

  const creditRead = useRead(
    () => (wallet.address ? getCredit(wallet.address) : Promise.resolve("0")),
    [wallet.address],
  );

  const agreementsRead = useRead(() => listAgreements(0, 30), []);
  const incidentsRead = useRead(() => listIncidents(0, 30), []);

  const mine: Agreement[] = useMemo(() => {
    const page = agreementsRead.data;
    if (!page?.items || !page?.order || !wallet.address) return [];
    const me = wallet.address.toLowerCase();
    return page.order
      .map((id: string) => page.items[id] as Agreement)
      .filter((a: Agreement) => a && (a.provider?.toLowerCase() === me || a.customer?.toLowerCase() === me));
  }, [agreementsRead.data, wallet.address]);

  const recentIncidents: Incident[] = useMemo(() => {
    const page = incidentsRead.data;
    if (!page?.items || !page?.order) return [];
    return page.order.map((id: string) => page.items[id] as Incident).filter(Boolean).slice(0, 6);
  }, [incidentsRead.data]);

  const credit = BigInt(creditRead.data ?? "0");
  const action = useAction(() => {
    creditRead.reload();
    statsRead.reload();
  });

  return (
    <div className="p-page">
      <section className="p-shell p-zone" style={{ paddingTop: 56 }}>
        <div className="zone-head p-enter">
          <div>
            <Kicker>Desk &amp; credits</Kicker>
            <h1 style={{ marginTop: 20 }}>
              Your
              <br />
              Account<span>.</span>
            </h1>
          </div>
          <p>
            Claims never leave the contract until you pull them. Credits accrue from settlements, returned bonds and
            awarded challenge stakes — withdraw whenever you like, from the wallet that owns them.
          </p>
        </div>

        <div className="p-card-list p-enter p-enter-1" style={{ gridTemplateColumns: "1.2fr .8fr", marginBottom: 26 }}>
          <div className="task-card" style={{ minHeight: 260 }}>
            <div className="task-card-head">
              <span className="p-folio">Claimable credit</span>
              <Banknote size={16} strokeWidth={1.6} style={{ color: "var(--p-accent-dark)" }} />
            </div>
            {wallet.connected && wallet.correctNetwork ? (
              <>
                <h3 style={{ marginTop: 26, fontSize: "clamp(34px,4vw,52px)" }}>
                  {formatGenAmount(credit)} <span style={{ fontSize: "0.4em", color: "var(--p-accent-dark)" }}>GEN</span>
                </h3>
                <p>
                  Held for {shortAddress(wallet.address || "")} on the canonical deployment. Settlement payouts,
                  provider bond returns and upheld challenge stakes land here.
                </p>
                <div className="task-card-foot">
                  <span className="p-folio" style={{ color: "var(--p-muted)" }}>
                    pull pattern · no auto-push
                  </span>
                  <button
                    className="p-btn p-btn-sm"
                    disabled={action.busy || credit === 0n || !creditRead.configured}
                    onClick={() => action.run("withdraw_credit", [wallet.address])}
                  >
                    {action.busy && <span className="p-spin" />}
                    Withdraw to wallet <ArrowUpRight size={12} />
                  </button>
                </div>
                <TxNotice state={action.state} />
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 26 }}>Connect to read your credit</h3>
                <p>
                  Credits are read per wallet directly from chain 61999. Connect an injected wallet (MetaMask or
                  compatible) on GenLayer Studionet.
                </p>
                <div className="task-card-foot">
                  <span className="p-folio" style={{ color: "var(--p-muted)" }}>
                    <Wallet size={12} style={{ verticalAlign: "-2px" }} /> injected EIP-1193 only
                  </span>
                  {!wallet.correctNetwork && wallet.connected ? (
                    <button className="p-btn p-btn-sm" onClick={() => wallet.switchNetwork()}>Switch to Studionet</button>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <div className="task-card" style={{ minHeight: 260 }}>
            <div className="task-card-head">
              <span className="p-folio">Protocol ledger health</span>
              <Gauge size={16} strokeWidth={1.6} style={{ color: "var(--p-accent-dark)" }} />
            </div>
            {stats ? (
              <>
                <h3 style={{ marginTop: 26, fontSize: "clamp(28px,3vw,40px)" }}>
                  {stats.accounting_balanced ? "Balanced" : "Review needed"}
                </h3>
                <p>
                  {plural(stats.agreements, "agreement")} · {plural(stats.incidents, "incident")} ·{" "}
                  {plural(stats.finalized_breaches, "finalized breach")} · {plural(stats.proven_exceptions, "proven exception")}.
                  Deposited {formatGenAmount(stats.total_deposited)} GEN across escrows and credits. No admin controls exist.
                </p>
                <div className="task-card-foot">
                  <span className="p-folio" style={{ color: "var(--p-muted)" }}>v{stats.version}</span>
                  <button className="p-btn p-btn-ghost p-btn-sm" onClick={() => statsRead.reload()}>
                    <RefreshCcw size={12} /> Re-read
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 26 }}>{statsRead.configured ? "Reading…" : "Awaiting deployment"}</h3>
                <p>
                  {statsRead.configured
                    ? statsRead.error || "Querying the canonical deployment on Studionet."
                    : "Protocol statistics appear once the canonical Studionet address is published in configuration."}
                </p>
                <div className="task-card-foot">
                  <span className="p-chip"><i />chain 61999</span>
                  <span className="p-chip"><ShieldCheck size={11} /> admin-free</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-case-grid p-enter p-enter-2">
          <div className="p-panel">
            <div className="p-panel-head">
              <span>Your pacts</span>
              <span>{wallet.connected ? plural(mine.length, "seat") : "wallet needed"}</span>
            </div>
            <div className="p-panel-body" style={{ paddingTop: 8 }}>
              {!wallet.connected ? (
                <p style={{ color: "var(--p-muted)", fontSize: 13 }}>Connect a wallet to see pacts you provide or consume.</p>
              ) : mine.length === 0 ? (
                <p style={{ color: "var(--p-muted)", fontSize: 13 }}>
                  No pact lists this wallet yet.{" "}
                  <Link to="/open" style={{ color: "var(--p-accent-dark)", textDecoration: "underline" }}>Seal one</Link>{" "}
                  or ask a provider to name you as customer.
                </p>
              ) : (
                mine.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px dotted var(--p-line-soft)" }}>
                    <div>
                      <b style={{ fontSize: 13.5 }}>{a.service_name}</b>
                      <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                        <span className="p-chip p-chip-solid"><i />{a.provider.toLowerCase() === wallet.address?.toLowerCase() ? "you provide" : "you consume"}</span>
                        <StatusChip status={a.status} />
                        <span className="p-chip">target {bpsToPercent(a.target_bps)}</span>
                      </div>
                    </div>
                    <Link className="p-btn p-btn-ghost p-btn-sm" to={`/agreements/${a.id}`}>
                      Open <ArrowRight size={12} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-panel">
            <div className="p-panel-head">
              <span>Latest incidents network-wide</span>
              <span>{incidentsRead.configured ? "live" : "offline"}</span>
            </div>
            <div className="p-panel-body" style={{ paddingTop: 8 }}>
              {recentIncidents.length === 0 ? (
                <p style={{ color: "var(--p-muted)", fontSize: 13 }}>
                  {incidentsRead.configured ? "No incidents recorded yet on this deployment." : "Incident history activates with the configured deployment."}
                </p>
              ) : (
                recentIncidents.map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px dotted var(--p-line-soft)" }}>
                    <div>
                      <b style={{ fontSize: 13.5 }}>{idToDisplay(i.id)} · {idToDisplay(i.agreement_id)}</b>
                      <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                        <StatusChip status={i.status} />
                        <span className="p-chip">observed {formatTimestamp(i.observed_from)}</span>
                      </div>
                    </div>
                    <Link className="p-btn p-btn-ghost p-btn-sm" to={`/agreements/${i.agreement_id}`}>
                      Case <ArrowRight size={12} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
