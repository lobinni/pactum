#!/usr/bin/env python3
"""Release wiring checks for PACTUM.

Verifies that every place a contract address or network parameter can appear
stays consistent: deployments/studionet.json, the frontend config module and
the deployment script all agree on chain 61999 and the studio RPC, and the
recorded canonical address (when set) is well-formed.
"""

import json
import re
import sys
from pathlib import Path

FAILURES = []
ZERO = "0x0000000000000000000000000000000000000000"


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"[{'ok' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        FAILURES.append(name)


def main() -> int:
    deployments_path = Path("deployments/studionet.json")
    config_path = Path("src/lib/config.ts")
    deploy_path = Path("deploy/deployScript.ts")
    contract_path = Path("contracts/pactum.py")
    for path in (deployments_path, config_path, deploy_path, contract_path):
        if not path.exists():
            print(f"missing required release file: {path}")
            return 1

    record = json.loads(deployments_path.read_text(encoding="utf-8"))
    config = config_path.read_text(encoding="utf-8")
    deploy = deploy_path.read_text(encoding="utf-8")
    contract = contract_path.read_text(encoding="utf-8")

    check("deployments record targets chain 61999", record.get("chainId") == 61999)
    check("deployments record uses the studio RPC", record.get("rpc") == "https://studio.genlayer.com/api")
    check("deployments record uses the studio explorer", record.get("explorer") == "https://explorer-studio.genlayer.com")

    address = record.get("canonicalDeployment", {}).get("address", "")
    check("canonical address is well-formed or the zero placeholder",
          address == ZERO or bool(re.fullmatch(r"0x[0-9a-fA-F]{40}", address)), address)
    tx = record["canonicalDeployment"].get("transaction", "")
    if tx:
        check("transaction hash is well-formed when recorded",
              bool(re.fullmatch(r"0x[0-9a-fA-F]{64}", tx)), tx)

    check("frontend config is hard-locked to 61999", "export const CHAIN_ID = 61999" in config)
    check("frontend config uses the studio RPC", '"https://studio.genlayer.com/api"' in config)
    check("frontend reads the address from VITE_PACTUM_CONTRACT first", "VITE_PACTUM_CONTRACT" in config)
    check("frontend fallback address matches deployments record",
          f'"{address}"' in config or address == ZERO)

    check("deploy script refuses other chains", 'EXPECTED_CHAIN = 61999' in deploy)
    check("deploy script writes the frontend env handoff", "VITE_PACTUM_CONTRACT" in deploy)
    check("deploy script writes the deployments record", "deployments/studionet.json" in deploy)

    check("contract reports chain 61999", 'NETWORK_ID = "61999"' in contract)
    check("contract and deployments record share the version string",
          record["canonicalDeployment"].get("version", "") in contract)

    historical = record.get("historicalDeployments", [])
    check("historical addresses are never wired into frontend config",
          all(h.get("address", "") not in config for h in historical))

    if FAILURES:
        print(f"\n{len(FAILURES)} release check(s) failed")
        return 1
    print("\nAll release wiring checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
