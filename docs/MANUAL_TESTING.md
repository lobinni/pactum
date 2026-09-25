# Manual live testing guide (Studionet 61999)

End-to-end walkthrough against the live canonical deployment. Every step is a
real signed transaction or a live read — there are no simulated paths. Work
with the sample payloads in `samples/`; replace every illustrative URL with
real, stable, non-redirecting public pages before touching value.

**Canonical contract:** `0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc`
([explorer](https://explorer-studio.genlayer.com/address/0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc))

## 0. Prepare

| Item | Requirement |
| --- | --- |
| Wallet | MetaMask (or any injected EIP-1193 wallet) — two accounts |
| Wallet A (provider) | Funded with GEN on Studionet: bond + challenge stake + fees |
| Wallet B (customer) | Funded with GEN on Studionet: fees (+ challenge stake if testing that role) |
| Network | GenLayer Studionet, chain id `61999`, RPC `https://studio.genlayer.com/api` |
| App | The production build of this repository (Vercel) or `npm run dev` locally |

Add the network once: the app prompts `wallet_addEthereumChain` automatically
when you connect, or add it manually in MetaMask with the values above.

Connect and confirm the header chip shows your shortened address without a
switch warning. A red prompt means the wallet is on the wrong chain — press
**Switch to Studionet** rather than signing anything.

## 1. Formation — Wallet A (provider)

1. Open **New Agreement** and fill the fields from `samples/01-agreement.acme-edge.json`
   (`form_fields`), with wallet B as the customer and your real evidence hosts.
2. Verify the seal checklist: customer address is a 40-hex address; service URL
   is HTTPS; measurement policy has at least two families including an
   independent probe outside the service domain; every clause code is unique.
3. Press **Sign and escrow bond** and confirm in MetaMask.
4. Watch the staged feedback: wallet signature → submitted → consensus stages
   → finalized. The app navigates to the ledger; open the new pact.
5. On-chain check: status is **PROPOSED**, the bond appears as agreement
   escrow, accounting stays balanced (Account page).

Expected rejection drills (safe and cheap):

- bond below the maximum credit → the chain refuses with a bond error;
- customer equal to provider → refused;
- measurement policy without an independent probe → refused.

## 2. Acceptance — Wallet B (customer)

1. Switch accounts in MetaMask; the app updates automatically.
2. Open the pact → **Accept this pact** → sign.
3. Confirm status flips to **ACTIVE** and the timeline shows the acceptance
   timestamp. After the formation deadline, anyone can instead expire an
   unaccepted proposal, returning the bond to the provider as credit.

## 3. Incident — Wallet B (customer)

1. After a completed observation window inside coverage, open **Open an incident**.
2. Fill from `samples/02-measurement-incident.json`: availability strictly
   below target, a completed interval, and at least the independent probe plus
   one corroborating family from the frozen origins.
3. Submit and wait for finality. The incident appears as
   **MEASUREMENT PENDING** with its frozen case hash.

Rejection drills:

- availability at/above target → refused;
- a URL outside the frozen origins → refused;
- a single measurement family → refused;
- claimed by wallet A → refused (customers only).

## 4. Measurement consensus — any wallet

1. Press **Verify measurement**. Keeper actions are permissionless.
2. Outcomes to recognize:
   - **OPEN** — corroborated; the measured value is written and the provider
     response window (1 hour) starts;
   - **MEASUREMENT REJECTED** — not corroborated; the agreement is unblocked,
     no breach exists;
   - **MEASUREMENT INCONCLUSIVE** — a source was unavailable; a 6-hour retry
     window starts, then **Dismiss measurement** unblocks the pact.

## 5. Exception — Wallet A (provider)

1. While the response window runs, choose the frozen clause and attach
   evidence from the frozen exception origins (`samples/03-exception-claim.json`).
2. Submit; status becomes **EXCEPTION CLAIMED**.

## 6. Adjudication — any wallet

1. Press **Adjudicate**. Consensus re-fetches measurement + exception sources.
2. Decisive outcomes: **PROVEN** (liability 0%), **PARTIAL** (liability computed
   from excused intervals — 50% in the canonical drill), **NOT PROVEN** (100%).
   Unavailable or unattributable evidence yields **INCONCLUSIVE** with a retry
   window and never causes relief.

## 7. Challenge — either party (optional)

1. During the frozen challenge window, post a bonded challenge with one URL
   from the challenge origins (`samples/04-challenge.json`).
2. Anyone resolves it. **UPHELD** revises the finding and returns the stake;
   **REJECTED** pays the stake to the counterparty; a stalled challenge can be
   expired after 24 hours, returning the stake.

## 8. Settlement — any wallet

1. After the challenge deadline (and any challenge resolution), finalize.
2. Verify the math: customer payout = max credit × liability share (capped by
   the bond); the remainder returns to the provider; both land as credits.
3. Alternative paths covered: unanswered verified miss → **Settle by default**
   (full breach); stalled inconclusive evidence → neutral close with the full
   bond returned.

## 9. Withdrawal — each wallet

1. Open **Account**, read your claimable credit (live read).
2. Withdraw; confirm the transfer and the stats partition moving from
   claimable to withdrawn.

## 10. Final audit

1. **Account** panel must show **Balanced** — deposited equals escrow +
   challenge escrow + claimable + withdrawn at every step.
2. Cross-check one or two actions on the explorer link shown beside each
   finalized transaction.
3. Archive the transaction hashes of each lifecycle step you executed (see
   `docs/LIVE_DEMO.md`) into the deployments record if you are producing
   release evidence.

## Troubleshooting

| Symptom | Meaning | Action |
| --- | --- | --- |
| Red chain prompt | Wallet not on 61999 | Press **Switch to Studionet** |
| Signing stage stalls | Waiting for MetaMask | Approve in the wallet popup |
| Long consensus stage | Validators voting on a nondet step | Keep the tab open; watch the staged banner |
| Read shows old state | Finality lag | Use the refresh control on the ledger row |
| Rejection with "EXPECTED" wording | A deterministic guard fired | Read the message; it names the violated rule |

## Rules of engagement

- Never retry a measurement marked rejected or an incident marked final.
- Never test failed drains against production: rejection drills are
  validation-only and refundable paths (expiry, neutral close) by design.
- Historical addresses from `deployments/studionet.json` are provenance only;
  always act on the canonical address above.
