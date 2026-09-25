# Agent handoff — PACTUM

Current state of this checkout and how to advance it safely.

## What is complete

- `contracts/pactum.py` — full Intelligent Contract, 21 public methods,
  three consensus blocks, four-partition accounting, release lock to
  Studionet 61999. Passes `python -m py_compile` and
  `scripts/check_contract_patterns.py`.
- `tests/direct/` — Direct Mode behavioural/adversarial suite for the
  deterministic surface.
- `tests/integration/` — opt-in live Studionet smoke (read-only) gated behind
  the `integration` marker and the `PACTUM_CONTRACT` env.
- `deploy/deployScript.ts` — 61999-locked deployment script that writes
  `deployments/studionet.json` and the frontend `.env.local` address handoff.
- `deployments/studionet.json` — canonical record (address pending first
  deployment; zero placeholder).
- Web application — Vite + React in `src/`, routes `/`, `/agreements`,
  `/agreements/:id`, `/open`, `/account`, `/protocol`; wallet connect +
  chain guard; all reads/writes flow through `src/lib/config.ts` and
  `src/lib/contract.ts` only.
- Documentation — `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`,
  `docs/TESTING.md`, `docs/CONFIGURATION.md`, `docs/LIVE_DEMO.md`,
  `STATIC_VERIFICATION.md`.

## What is deliberately pending

1. **Deployment record completion.** The canonical 1.0.0 release is live at
   `0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc`; add the deployment
   transaction hash to `deployments/studionet.json` from the deployer wallet
   history. Do not re-run the deployment script against this version.
2. **Live lifecycle receipt set.** Follow `docs/MANUAL_TESTING.md` end-to-end
   on the canonical address and archive every transaction hash into the
   deployments record under a `lifecycleEvidence` key.
3. **CI.** Wire the release gates from `STATIC_VERIFICATION.md` into your
   pipeline; the integration suite stays opt-in.
4. **Publishing.** `docs/PUBLISHING.md` has the GitHub push commands and the
   Vercel recipe (single env variable, no database).

## Non-negotiables

- Never wire a historical address into current code.
- Never retry a measurement marked rejected/undetermined on a live address.
- Never widen the wallet surface beyond injected EIP-1193 on chain 61999.
- Every user-facing write keeps the pre-sign wallet guard in place.
