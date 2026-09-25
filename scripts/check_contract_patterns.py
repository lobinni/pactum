#!/usr/bin/env python3
"""Static contract-pattern guards for the PACTUM release.

These checks intentionally do not execute consensus code; they verify the
reviewed structural invariants of contracts/pactum.py so a release cannot
silently drift from the audited architecture.
"""

import re
import sys
from pathlib import Path

CONTRACT = Path("contracts/pactum.py")

FAILURES = []


def check(name: str, ok: bool, detail: str = "") -> None:
    status = "ok" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        FAILURES.append(name)


def main() -> int:
    if not CONTRACT.exists():
        print("contracts/pactum.py is missing")
        return 1
    source = CONTRACT.read_text(encoding="utf-8")

    public_writes = re.findall(r"@gl\.public\.write(?:\.payable)?\n\s*def\s+(\w+)", source)
    public_views = re.findall(r"@gl\.public\.view\n\s*def\s+(\w+)", source)
    check("public method surface is exactly 21", len(public_writes) + len(public_views) == 21,
          f"found {len(public_writes)} writes + {len(public_views)} views")
    check("write surface count is 15", len(public_writes) == 15, f"found {len(public_writes)}")
    check("view surface count is 6", len(public_views) == 6, f"found {len(public_views)}")

    expected = {
        "create_agreement", "accept_agreement", "expire_proposal", "open_incident",
        "verify_measurement", "dismiss_unproven_measurement", "claim_exception",
        "adjudicate_exception", "challenge_exception", "resolve_challenge",
        "expire_challenge", "finalize_default_breach", "finalize_incident",
        "expire_agreement", "withdraw_credit", "get_agreement", "list_agreements",
        "get_incident", "list_incidents", "get_credit", "get_stats",
    }
    check("public surface matches the reviewed method set", set(public_writes) | set(public_views) == expected)

    check("payable entrypoints are exactly create_agreement and challenge_exception",
          len(re.findall(r"@gl\.public\.write\.payable\n\s*def\s+create_agreement", source)) == 1
          and len(re.findall(r"@gl\.public\.write\.payable\n\s*def\s+challenge_exception", source)) == 1)

    check("release lock constants are pinned",
          'NETWORK_ID = "61999"' in source and 'RPC_URL = "https://studio.genlayer.com/api"' in source)
    check("version carries the studionet suffix", '"1.0.0-studionet"' in source)

    check("no admin or owner role exists", "owner" not in re.sub(r"#.*", "", source).lower())

    check("consensus uses run_nondet_unsafe exactly three times",
          source.count("gl.vm.run_nondet_unsafe") == 3, f'found {source.count("gl.vm.run_nondet_unsafe")}')
    check("all nondet blocks ship validator functions", source.count("def validator_fn") == 3)
    check("all nondet blocks ship leader functions", source.count("def leader_fn") == 3)

    check("accounting partitions present in stats",
          all(k in source for k in ("agreement_escrow", "challenge_escrow", "total_claimable", "total_withdrawn")))
    check("balance invariant helper exists", "def _balanced" in source)
    check("withdraw uses pull pattern with checked send", "gl.evm.send(account, u256(amount), check=True)" in source)
    check("credits move before external send", source.find("self.total_withdrawn = u256") < source.find("gl.evm.send(account"))

    check("digest commitments exist for all three decision stages",
          all(k in source for k in ("measurement_evidence_digest", "exception_evidence_digest", "challenge_evidence_digest")))
    check("observation digests are recorded separately", source.count("_observation_digest") >= 3)
    check("retrieval modes are frozen per source policy", all(m in source for m in ("REQUEST_JSON", "REQUEST_TEXT", "RENDER_TEXT")))
    check("independent probe is mandatory for measurement", "INDEPENDENT_PROBE" in source)

    check("no dynamic exec/eval in contract", "eval(" not in source and "exec(" not in source)
    check("no secrets or private keys in contract", "private_key" not in source.lower())

    if FAILURES:
        print(f"\n{len(FAILURES)} contract pattern check(s) failed")
        return 1
    print("\nAll contract pattern checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
