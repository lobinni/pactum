# Live demo walkthrough (Studionet 61999)

A scripted, read-backable path through the full economic lifecycle. All steps
require an injected EIP-1193 wallet (MetaMask or compatible) connected to
GenLayer Studionet (chain 61999) with GEN for fees and the provider bond.

## 0. Prerequisites

- Wallet A (provider) and wallet B (customer) funded on Studionet.
- The canonical deployment address from `deployments/studionet.json` (the web
  app banner shows it; see `docs/CONFIGURATION.md`).
- Two or more stable, public, non-redirecting HTTPS evidence sources: one
  independent probe origin outside the service domain and one corroborating
  origin.

## 1. Agreement formation (provider, wallet A)

1. Open **New Agreement**, connect wallet A on Studionet.
2. Fill the frozen terms: service name/URL, metric, availability target
   (basis points), coverage window start/end, max credit, and the exact
   exception clauses with proof requirements.
3. Define the source policy: measurement needs the independent probe plus a
   corroborating family; exception and challenge groups list their allowed
   origins with a frozen retrieval mode each.
4. Set the provider bond (must cover max credit), review, sign.
5. Wait for finalization; the agreement reads back `PROPOSED`.

## 2. Acceptance (customer, wallet B)

Open the agreement, connect wallet B, accept before the formation deadline.
It reads back `ACTIVE` with the recorded acceptance timestamp.

## 3. Incident opening (customer, wallet B)

After the window closes, open an incident with a measured availability below
the target, a completed observation interval inside the frozen window, and
measurement evidence from the frozen policy origins. The incident reads back
`MEASUREMENT_PENDING` with a case hash.

## 4. Measurement consensus (any wallet)

Run verification. Consensus fetches every frozen source independently, and the
incident transitions:

- supportive, attributable → `OPEN` with the consensus-measured value and the
  provider response deadline;
- uncorroborated → `MEASUREMENT_REJECTED`, agreement unblocked;
- unavailable evidence → `MEASUREMENT_INCONCLUSIVE` with a bounded retry
  window, then dismissal if it stays unavailable.

## 5. Exception adjudication (provider, wallet A)

Within the response window, claim one frozen clause with exception evidence
from the frozen origins. Anyone may then trigger adjudication. A decisive
result moves the incident to `PENDING` with the adjudicated outcome,
deterministic liability share and the challenge deadline.

## 6. Optional challenge (either party)

Post a challenge with a bond and one evidence URL from the challenge policy
group. Resolution re-fetches every original source plus the challenge source;
`UPHELD` revises the finding and returns the bond, `REJECTED` awards the bond
to the counterparty, `INCONCLUSIVE`/`SOURCE_UNAVAILABLE` leave the pending
finding intact.

## 7. Settlement

After the challenge deadline (and any challenge resolution), anyone finalizes:

- payout to the customer equals max credit × liability share, capped by the
  bond;
- the remainder returns to the provider;
- both amounts accrue as credits and each party withdraws from **Account**.

If the provider never responds after a verified miss, `finalize_default_breach`
settles the full default after the response deadline. If evidence stays
unavailable through the retry window, the incident closes neutrally and the
full bond returns.

## 8. Verification

At any point, confirm on **Account** or the explorer that `get_stats()` still
reports balanced accounting: deposited equals escrow + challenge escrow +
claimable + withdrawn. `scripts/verify_accounting.py <address>` replays the
same check from a shell.
