# Architecture

PACTUM is a single Intelligent Contract for provider-backed service-level
agreements with consensus-adjudicated exception clauses, plus a first-party
web application.

## Layers

| Layer | Responsibility |
| --- | --- |
| `contracts/pactum.py` | All state, value custody, consensus orchestration |
| Web application (`src/`) | Wallet connection, on-chain reads, user-approved writes |
| `deploy/` + `deployments/` | Release automation and provenance records |
| `scripts/` | Static release guards (patterns, wiring, accounting) |
| `tests/` | Direct Mode behavioural suite + opt-in live smoke |

## Contract model

The contract stores agreements and incidents as canonical JSON documents in
`TreeMap` storage with `DynArray` identifier indexes for deterministic
pagination. All money is expressed in atto-GEN strings inside documents; the
four accounting partitions (`agreement_escrow`, `challenge_escrow`,
`total_claimable`, `total_withdrawn`) are native `u256` storage and must
always sum to `total_deposited`. `get_stats()` recomputes that invariant on
every read.

### State machines

Agreement: `PROPOSED → ACTIVE → CLOSED | EXPIRED`

Incident:

```
MEASUREMENT_PENDING ──VERIFIED──> OPEN ──claim──> EXCEPTION_CLAIMED ──decisive──> PENDING ──> FINAL
        │                           │                     │
        │ SOURCE_UNAVAILABLE        │ no claim by         │ SOURCE_UNAVAILABLE
        ▼                           ▼ response deadline   ▼
MEASUREMENT_INCONCLUSIVE      default breach          INCONCLUSIVE ──> neutral close
        │
        ▼ dismissed after retry window
MEASUREMENT_REJECTED
```

### Consensus boundaries

Three `run_nondet_unsafe` blocks exist and nothing else is non-deterministic:

1. `verify_measurement` — corroborates the claimed miss against the frozen
   measurement sources.
2. `adjudicate_exception` — decides whether evidence establishes the exact
   frozen clause and derives excusable intervals (never percentages).
3. `resolve_challenge` — re-fetches every original source plus the challenge
   source and re-evaluates the pending finding.

Every block returns a bounded result object; validator functions independently
re-execute the leader function and compare only consequential fields
(result, attribution booleans, interval sets, and the consensus evidence
digest). Narrative reasoning is never compared.

### Evidence pipeline

`fetch (frozen retrieval mode) → independent structured manifest per source →
normalize + clip intervals to the frozen window → digest consequential
fields`. Retrieval modes are frozen per source policy at formation:
`REQUEST_JSON`, `REQUEST_TEXT`, `RENDER_TEXT`. Processing ceiling is 24,000
characters per source, 48,000 per decision; persisted canonical manifests are
bounded to 3,600 characters per source.

### Authorization matrix

| Action | Caller |
| --- | --- |
| `create_agreement` | provider (bond escrowed) |
| `accept_agreement` | named customer |
| `open_incident` | customer, on ACTIVE agreement |
| `verify_measurement`, `adjudicate_exception`, `resolve_challenge` | anyone (keeper role) |
| `claim_exception` | provider, within response window |
| `challenge_exception` | either bound party (bond escrowed) |
| `finalize_*`, `expire_*` | anyone, after timing guards |
| `withdraw_credit` | credit owner to their own wallet |

## Web application

React + Vite single-page app. All chain configuration lives in
`src/lib/config.ts`; the deployed address resolves from the
`VITE_PACTUM_CONTRACT` build env with a single fallback constant in that
file. Writes go through `genlayer-js` with the injected EIP-1193 provider and
a strict pre-sign wallet guard (`src/lib/walletGuard.ts`) that reasserts
chain 61999 and account identity immediately before submission.
