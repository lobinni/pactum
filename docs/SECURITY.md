# Security model

PACTUM treats every external input — user calldata, fetched web content,
model output and even validator observations — as untrusted. All consequential
transitions are re-derived deterministically.

## Invariants

1. **Accounting conservation.** `total_deposited = agreement_escrow +
   challenge_escrow + total_claimable + total_withdrawn` holds across every
   write. `get_stats()` recomputes it; `scripts/verify_accounting.py` replays
   it off-chain.
2. **No admin surface.** There is no owner key, upgrade hook, pause switch or
   privileged address. `get_stats().admin_controls` is hard-coded `false`.
3. **Pull payments.** Settlement never pushes value during a lifecycle call;
   it accrues to `credits`, and `withdraw_credit` clears the ledger entry
   before the checked external send so a failing transfer cannot be replayed.
4. **Frozen cases.** Measurement, exception and challenge decisions commit to
   `*_case_hash` values assembled from the immutable agreement spec hash, the
   frozen window and the submitted evidence, so decisions cannot be re-pointed
   at altered inputs after the fact.
5. **Consensus containment.** Only three methods run non-deterministic
   blocks; validators re-execute and compare bounded fields only. Consensus
   never returns money amounts or percentages — liability basis points are
   recomputed deterministically from validated interval sets.

## Threat notes

- **Customer exaggeration.** Opening an incident requires `actual_bps` strictly
  below the frozen target; a fabricated number still needs every frozen
  source — including an independent probe — to corroborate it, or the
  measurement is rejected and the agreement unblocked.
- **Provider excuse invention.** Only clauses frozen at formation can be
  claimed, evidence must come from origins frozen in the source policy, and
  unattributable or stale evidence produces `INCONCLUSIVE`, never relief.
- **Prompt injection from evidence.** All fetched text is treated as data,
  never instructions; manifests are structurally validated, intervals are
  clipped and merged deterministically, and digest comparison ignores any
  narrative the model adds.
- **Evidence replay.** Interval endpoints must intersect the frozen window;
  events wholly outside it are normalized away and a source that only carries
  out-of-window history cannot support the requested fact.
- **Re-entrancy.** Value moves via credit accrual; the single external send
  happens after ledger mutation with `check=True`.
- **Network confusion.** Contract, deploy script, frontend and release guards
  all reject anything that is not chain 61999 on the studio gateway. The
  frontend additionally re-asserts the wallet chain immediately before every
  signature request.

## Limits

- Bonds: 0.001–50 GEN per agreement. Challenge stakes: 0.0001–10 GEN.
- Evidence: ≤ 8 sources per stage; ≤ 8 policy origins per group; ≤ 8 frozen
  clauses per agreement.
- Windows: SLA window 30 minutes–90 days; formation lead ≥ 5 minutes;
  challenge window 10 minutes–24 hours.
