# Static verification log

Checks actually run while packaging this checkout, with exact commands.
Canonical deployment on record: `0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc`
(Studionet 61999).

| Check | Command | Scope |
| --- | --- | --- |
| Python compilation | `python -m py_compile contracts/pactum.py tests/direct/*.py tests/integration/*.py` | syntax of contract and both suites |
| Contract pattern guard | `python scripts/check_contract_patterns.py` | 21-method surface, 3 consensus blocks, payable set, release lock, no admin surface, digest commitments |
| Release wiring guard | `python scripts/check_release.py` | chain/RPC/version/address consistency across contract, deployments record, deploy script, frontend config |
| Accounting replay | `python scripts/verify_accounting.py <deployed-address>` | off-chain recomputation of the deposit partition sum (requires a live address) |
| Web build | `npm ci && npm run build` | type-safe production bundle of the application |

## Release gates for finishing environments

```
py -3.12 -m pip install -r requirements.txt
genvm-lint check contracts/pactum.py --json
pytest tests/direct/ -v
npm ci
npm run build
PACTUM_CONTRACT=0xDeployedAddress pytest -m integration -v   # opt-in live
```

A green CI run and a deployment receipt are not evidence that lifecycle
transactions occurred; retain receipts for every state-changing transaction
demonstrated live.
