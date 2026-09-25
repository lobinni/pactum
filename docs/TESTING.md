# Testing guide

All content and commands are in English. Windows paths are shown with `py -3.12`;
on macOS/Linux use `python3` / `python` equivalents.

## 1. Environment

```
py -3.12 -m pip install -r requirements.txt
```

This pins `genlayer-test==0.29.2`, `genlayer-py==0.16.3`,
`genvm-linter==0.11.0`, `pyright` and `pytest==9.0.2`.

## 2. Static guards (always run first)

```
python -m py_compile contracts/pactum.py tests/direct/*.py tests/integration/*.py
genvm-lint check contracts/pactum.py --json
python scripts/check_contract_patterns.py
python scripts/check_release.py
```

- `check_contract_patterns.py` asserts the reviewed structural invariants: the
  exact 21-method public surface, exactly three consensus blocks with
  leader/validator functions, the payable entrypoints, the release-lock
  constants, the absence of admin roles, and digest commitments at every
  decision stage.
- `check_release.py` verifies that the contract, the deployments record, the
  deploy script and the frontend config all agree on chain 61999, the studio
  RPC, the version string, and the address handoff mechanism.

## 3. Direct Mode suite (default)

```
pytest tests/direct/ -v
```

The suite covers, without a running network:

- formation validation (bonds, windows, clause parsing, source policy,
  probe-independence and duplicate-family rules);
- authorization for every restricted transition;
- incident opening boundaries (target comparison, observation containment,
  measurement evidence family minimums, policy-bound URLs);
- measurement/exception/challenge deterministic gating at the consensus
  boundary;
- escrow partitions, expiry credit returns, withdrawal ownership, pagination
  bounds and accounting conservation checks.

Run it after every contract edit; consensus methods themselves execute under
`gltest` with mocked non-determinism in the extended suite.

## 4. Live Studionet smoke (opt-in)

Point the suite at the canonical deployment (or any finalized address) and run:

```
PACTUM_CONTRACT=0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc pytest -m integration -v
```

Checks performed (read-only):

1. the address serves `get_stats()` reporting chain `61999`, the studio RPC
   and a `-studionet` version suffix;
2. accounting is balanced and deposited value equals the sum of the four
   partitions.

Never wire historical addresses into current code.

## 5. Manual lifecyle walkthrough (live, two wallets)

The complete manual exercise lives in `docs/MANUAL_TESTING.md`, driven by the
reference payloads in `samples/` (agreement formation, incident opening,
exception claim, bonded challenge). It covers the full economic lifecycle on
the canonical Studionet address with two MetaMask accounts: provider forms and
escrows, customer accepts and reports, keepers trigger consensus steps, both
sides withdraw. `docs/LIVE_DEMO.md` condenses the same path for demos.

## What must never be tested against production

- replaying a finalized `FINAL` incident;
- re-running a preserved `UNDETERMINED` or `MEASUREMENT_REJECTED` measurement;
- writes from addresses other than the authorized party.
