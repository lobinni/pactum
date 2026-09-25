"""
Opt-in live Studionet smoke test for a deployed PACTUM address.

This module never runs in CI by default. Point it at a finalized Studionet
deployment and execute it explicitly:

    PACTUM_CONTRACT=0xYourDeployedAddress pytest -m integration -v

It performs read-only checks: the address must serve a contract whose
get_stats() reports the release lock (chain 61999, studio RPC, version
suffix) and balanced accounting.
"""

import json
import os
import urllib.request

import pytest

RPC = "https://studio.genlayer.com/api"
EXPECTED_CHAIN = "61999"

pytestmark = pytest.mark.integration


def _studio_call(address: str) -> dict:
    """Minimal read-only call through the studio JSON-RPC gateway."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "gen_call",
        "params": {
            "type": "read",
            "to": address,
            "data": json.dumps({"function": "get_stats", "args": []}),
        },
    }
    request = urllib.request.Request(
        RPC,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
    if "error" in body:
        raise RuntimeError(body["error"])
    response_text = body.get("result", {}).get("response", "")
    return json.loads(response_text) if isinstance(response_text, str) else response_text


@pytest.fixture(scope="module")
def deployed_address():
    address = os.environ.get("PACTUM_CONTRACT", "").strip()
    if not address:
        pytest.skip("set PACTUM_CONTRACT to a finalized Studionet address to run integration checks")
    return address


def test_release_lock_is_reported(deployed_address):
    stats = _studio_call(deployed_address)
    assert str(stats.get("chain_id")) == EXPECTED_CHAIN
    assert stats.get("rpc") == RPC
    assert str(stats.get("version", "")).endswith("-studionet")
    assert stats.get("network") == "Studionet"


def test_accounting_partition_is_balanced(deployed_address):
    stats = _studio_call(deployed_address)
    assert stats.get("accounting_balanced") is True
    assert stats.get("admin_controls") is False
    deposited = int(stats.get("total_deposited", "0"))
    partitions = (
        int(stats.get("agreement_escrow", "0"))
        + int(stats.get("challenge_escrow", "0"))
        + int(stats.get("claimable", "0"))
        + int(stats.get("withdrawn", "0"))
    )
    assert deposited == partitions
