import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCcw } from "lucide-react";
import Kicker from "../components/Kicker";
import EmptyState from "../components/EmptyState";
import StatusChip from "../components/StatusChip";
import { listAgreements } from "../lib/contract";
import { useRead } from "../lib/useRead";
import { agreementLabel, bpsToPercent, idToDisplay, shortAddress } from "../lib/format";
import { formatGenAmount } from "../lib/amount";
import { formatTimestamp } from "../lib/time";
import type { Agreement } from "../lib/types";

const FILTERS = ["all", "proposed", "active", "closed", "expired"];
const PAGE_SIZE = 12;

export default function Agreements() {
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const read = useRead(() => listAgreements(offset, PAGE_SIZE), [offset]);

  const agreements: Agreement[] = useMemo(() => {
    const page = read.data;
    if (!page?.items || !page?.order) return [];
    return page.order.map((id: string) => page.items[id]).filter(Boolean);
  }, [read.data]);

  const filtered = useMemo(
    () => (filter === "all" ? agreements : agreements.filter((a) => (a.status || "").toLowerCase() === filter)),
    [agreements, filter],
  );

  const total = read.data?.total ?? 0;

  return (
    <div className="p-page">
      <section className="p-shell p-zone" style={{ paddingTop: 56 }}>
        <div className="zone-head p-enter">
          <div>
            <Kicker>
              Sealed pacts · {read.configured ? `${total} recorded` : "awaiting deployment"}
            </Kicker>
            <h1 style={{ marginTop: 20 }}>
              Agreement
              <br />
              Ledger<span>.</span>
            </h1>
          </div>
          <p>
            Every pact freezes its terms, its evidence sources and its exception clauses before the bond moves.
            Filter by lifecycle state; open a pact to act inside its workflow.
          </p>
        </div>

        <div className="filter-row p-enter p-enter-1" style={{ marginBottom: 0 }}>
          {FILTERS.map((item) => (
            <button
              key={item}
              className={`filter-button${filter === item ? " is-active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
          <button
            className="filter-button"
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={read.reload}
            aria-label="Reload on-chain data"
          >
            <RefreshCcw size={11} /> refresh
          </button>
        </div>

        {!read.configured ? (
          <EmptyState
            title="No canonical deployment configured"
            body="The Studionet release address has not been published yet. Once the deployment script finalizes and the address is set in configuration, the ledger reads directly from chain 61999."
            ctaLabel="Open the protocol guide"
            ctaTo="/protocol"
          />
        ) : read.loading ? (
          <div className="p-empty"><span className="p-spin" style={{ margin: "0 auto", width: 26, height: 26, borderWidth: 2 }} /></div>
        ) : read.error ? (
          <EmptyState
            title="Ledger temporarily unreachable"
            body={`The studio gateway could not answer this read (${read.error}). Retry shortly; nothing here is cached or reconstructed locally.`}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={agreements.length === 0 ? "No pacts sealed yet" : "Nothing in this state"}
            body={
              agreements.length === 0
                ? "Seal the first provider-backed pact: freeze the metric, the window and the exception clauses, escrow the bond, and invite the customer to accept."
                : "No recorded pact currently sits in this lifecycle state."
            }
            ctaLabel="Seal a new agreement"
            ctaTo="/open"
          />
        ) : (
          <>
            <div className="p-card-list p-enter p-enter-2" style={{ borderTop: 0 }}>
              {filtered.map((a) => (
                <article key={a.id} className={`task-card${a.status === "CLOSED" ? " is-locked" : ""}`}>
                  <div className="task-card-head">
                    <span className="p-folio">{idToDisplay(a.id)}</span>
                    <StatusChip status={a.status} />
                  </div>
                  <h3>{a.service_name}</h3>
                  <p>
                    {a.metric_name} · target {bpsToPercent(a.target_bps)} · window{" "}
                    {formatTimestamp(a.window_start)} → {formatTimestamp(a.window_end)}
                  </p>
                  <div className="task-card-meta">
                    <span className="p-chip p-chip-solid"><i />{agreementLabel(a.status)}</span>
                    <span className="p-chip">Bond {formatGenAmount(a.bond_atto)} GEN</span>
                    <span className="p-chip">Ceiling {formatGenAmount(a.max_credit_atto)} GEN</span>
                    <span className="p-chip">{a.exceptions?.length ?? 0} frozen clauses</span>
                    {a.incident_id ? <span className="p-chip">{idToDisplay(a.incident_id)} open</span> : null}
                  </div>
                  <div className="task-card-foot">
                    <span className="p-folio" style={{ color: "var(--p-muted)" }} title={a.provider}>
                      Provider {shortAddress(a.provider)}
                    </span>
                    <Link className="p-btn p-btn-ghost p-btn-sm" to={`/agreements/${a.id}`}>
                      Open case <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {total > offset + PAGE_SIZE ? (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
                <button className="p-btn p-btn-ghost" onClick={() => setOffset((v) => v + PAGE_SIZE)}>
                  Load older pacts · {total - offset - PAGE_SIZE} more
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
