#!/usr/bin/env python3
"""Independently verify the PACTUM accounting partition against a deployment.

Usage: python scripts/verify_accounting.py <address>
Reads get_stats() from the studio gateway and asserts that total deposited
equals the sum of agreement escrow, challenge escrow, claimable credit and
withdrawn value — the exact invariant the contract self-reports.
"""

import json
import sys
import urllib.request

RPC = "https://studio.genlayer.com/api"


def studio_call(address: str) -> dict:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "gen_call",
        "params": {"type": "read", "to": address, "data": json.dumps({"function": "get_stats", "args": []})},
    }
    request = urllib.request.Request(RPC, data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
    if "error" in body:
        raise RuntimeError(body["error"])
    text = body.get("result", {}).get("response", "")
    return json.loads(text) if isinstance(text, str) else text


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python scripts/verify_accounting.py <deployed-address>")
        return 1
    stats = studio_call(sys.argv[1])
    deposited = int(stats.get("total_deposited", "0"))
    partitions = (
        int(stats.get("agreement_escrow", "0"))
        + int(stats.get("challenge_escrow", "0"))
        + int(stats.get("claimable", "0"))
        + int(stats.get("withdrawn", "0"))
    )
    print(json.dumps(stats, indent=2, sort_keys=True))
    print(f"\ndeposited == partitions: {deposited} == {partitions}")
    if deposited != partitions or stats.get("accounting_balanced") is not True:
        print("ACCOUNTING MISMATCH")
        return 1
    print("Accounting invariant holds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
