# PACTUM

**A provider-backed SLA exception protocol: independently prove the miss first, then let GenLayer consensus decide whether a frozen exception clause actually excuses it.**

PACTUM is hard-locked to **GenLayer Studionet only**:

- chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- wallet: generic injected **EIP-1193** through `window.ethereum` only (MetaMask or any compatible injected wallet)

There is no alternate-network release path, no Snaps path, no WalletConnect path, no embedded wallet, no backend signer and no browser private key anywhere in the application.

## Live deployment

**Canonical release 1.0.0-studionet** is deployed on Studionet 61999 at [`0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc`](https://explorer-studio.genlayer.com/address/0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc). The web application resolves this address from `src/lib/config.ts` (fallback constant) or the build-time `VITE_PACTUM_CONTRACT` env; both are verified against `deployments/studionet.json` by `scripts/check_release.py`. All reads and writes in the UI are live on-chain calls — no demo data, no database, no backend.

## Stable Studionet toolchain

The release toolchain is pinned to stable Studionet 61999: Python 3.12, GenLayer CLI 0.39.1, `genlayer-js==1.1.8`, `genlayer-test==0.29.2`, `genlayer-py==0.16.3`, `genvm-linter==0.11.0`, Node 22, and the stable `py-genlayer` runtime hash in the contract header.

## Product boundary

PACTUM deliberately keeps SLA arithmetic deterministic. A customer cannot expose provider collateral merely by typing a poor availability number, and a provider cannot invent an exception after failure. Independent measurement consensus opens the incident; only then can a frozen exception be adjudicated and challenged.

Deterministic systems can establish the measured SLA result. They cannot reliably decide whether a frozen semantic clause such as *“an upstream infrastructure failure materially caused this service impact”* is established by conflicting public evidence, whether causation matches the observation interval, or whether that exact frozen exception applies. PACTUM uses deterministic code for timing, thresholds, interval arithmetic and money, while consensus is restricted to the contested semantic interpretation.

**Deterministic responsibilities:** agreement formation, authorization, timing, source-policy enforcement, measurement threshold comparison, interval validation, partial-liability arithmetic, GEN allocation, settlement and accounting.

**Consensus responsibilities:** semantic interpretation of public evidence, whether facts establish the exact frozen exception, causal relation to the measured impact, and challenge re-evaluation. Consensus is never used for arithmetic or ordinary deterministic oracle facts.

Evidence uses a provider-neutral pipeline: fetch each frozen source, independently extract a bounded structured manifest, normalize it, then compare consequential fields. Volatile request timestamps, rolling metadata, counters, response ordering, unrelated current records and page chrome never enter the consensus digest. The `measurement_evidence_digest`, `exception_evidence_digest` and `challenge_evidence_digest` commit to normalized source identity, service/window attribution, source contribution, measured availability and event intervals. Separate `*_observation_digest` values commit to the accepted leader's fetched body hashes for audit; they are not required to match validators' observations. Each source is processed up to 24,000 characters (48,000 total per decision), while only bounded structured manifests are persisted.

Each source policy freezes a retrieval mode: `REQUEST_JSON`, `REQUEST_TEXT` or `RENDER_TEXT` (omitted mode defaults to `RENDER_TEXT`). A decisive measurement requires every submitted source to contribute evidence for the named service and completed observation interval, including an independent probe and a corroborating family. Malformed, empty, unattributable, stale or unavailable evidence remains non-decisive.

## Main lifecycle

`create_agreement → accept_agreement → open_incident → verify_measurement → claim_exception → adjudicate_exception → optional challenge_exception/resolve_challenge → finalize_incident (or bounded default breach) → withdraw_credit`

## Repository

```
contracts/pactum.py           one substantial Intelligent Contract (21 public methods)
tests/direct/                 authored behavioural/adversarial Direct Mode coverage
tests/integration/            opt-in live Studionet smoke against a deployed address
src/                          web application (Vite + React, routes mirror the protocol)
deploy/deployScript.ts        61999-locked deployment script
deployments/studionet.json    canonical + historical deployment records
scripts/                      static contract-pattern and release wiring guards
docs/                         architecture, security, testing, configuration, live demo,
                              manual live-testing and publishing guides
samples/                      reference payloads for the manual live walkthrough
vercel.json                   static SPA hosting config (single-file build, no backend)
```

Guides: manual live exercise in `docs/MANUAL_TESTING.md`, shipping in
`docs/PUBLISHING.md` (GitHub push commands and the Vercel deploy recipe),
address rotation in `docs/CONFIGURATION.md`.

See `docs/CONFIGURATION.md` for the single-value contract address handoff.

## Static checks

```
python -m py_compile contracts/pactum.py tests/direct/*.py tests/integration/*.py
python scripts/check_contract_patterns.py
python scripts/check_release.py
```

## Release gates

```
py -3.12 -m pip install -r requirements.txt
genvm-lint check contracts/pactum.py --json
pytest tests/direct/ -v
npm ci
npm run build
```

## Frontend

The UI is intentionally product-specific rather than a reusable crypto dashboard. Visual direction: **live consensus operations deck — ink-dark hero panel with floating validator nodes, mint grid lines, sharp-cornered paper cards, mono uppercase labels**.

Routes: `/`, `/agreements`, `/agreements/:id`, `/open`, `/account`, `/protocol`. Primary navigation is limited to Agreements, New Agreement, Account and Protocol; incident-specific actions stay inside the agreement workflow. The New Agreement form starts blank. **Load Sample Agreement** is an explicit opt-in and its illustrative terms must be checked and replaced before a real proposal.

Reading and writing require reading the chain through the studio gateway; every write is signed by the connected EIP-1193 wallet on chain 61999. If the wallet sits on another network the application refuses to submit and offers to switch chains instead. The app is a static single-page build (see `docs/PUBLISHING.md` for the Vercel recipe — one env variable, no database URL).
