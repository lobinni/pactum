"""
PACTUM Direct Mode suite — authored behavioural and adversarial coverage.

Runs entirely against the Direct Mode VM (fixtures: direct_vm, direct_deploy,
direct_alice, direct_bob). Web fetches and model responses are mocked, so the
deterministic guards and the consensus result-handling are both exercised.

Run:  pytest tests/direct/ -v
"""

import json

from tests.direct.conftest import create_address, hx

CONTRACT = "contracts/pactum.py"
GEN = 10 ** 18

WINDOW_START = 1789819200
WINDOW_END = 1792411200
OBS_FROM = 1789819200
OBS_TO = 1789822800  # one hour observation inside the frozen window

EXCEPTIONS = json.dumps([
    {
        "code": "UPSTREAM",
        "title": "Upstream infrastructure failure",
        "rule": "A documented failure of a named hosting dependency materially caused the service impact during the frozen window.",
        "proof": "Official upstream incident record plus the service impact timeline.",
    },
    {
        "code": "MAINT",
        "title": "Scheduled maintenance",
        "rule": "Only a notice published at least 48 hours before the window and matching its exact interval may qualify.",
        "proof": "Timestamped official notice and incident timeline.",
    },
])

EVIDENCE = json.dumps([
    {"kind": "INDEPENDENT_PROBE", "url": "https://probe.example/incident", "note": "Independent measured service window."},
    {"kind": "STATUS_AGGREGATOR", "url": "https://status-archive.example/incident", "note": "Separate public status archive for the same window."},
])

SOURCE_POLICY = json.dumps({
    "measurement": [
        {"kind": "INDEPENDENT_PROBE", "host": "probe.example", "path_prefix": "/incident"},
        {"kind": "STATUS_AGGREGATOR", "host": "status-archive.example", "path_prefix": "/incident"},
    ],
    "exception": [
        {"kind": "UPSTREAM_STATUS", "host": "status.example.net", "path_prefix": "/incident"},
    ],
    "challenge": [
        {"kind": "COUNTER_EVIDENCE", "host": "counter.example", "path_prefix": "/evidence"},
    ],
})

EXCEPTION_EVIDENCE = json.dumps([
    {"kind": "UPSTREAM_STATUS", "url": "https://status.example.net/incident", "note": "Official named upstream incident and timestamps."},
])

POLICY_TEXT = "Provider plus independent public evidence; unattributable or stale evidence never excuses a miss."


def deploy(direct_deploy):
    return direct_deploy(CONTRACT)


def manifests(source_ids, availability=9900, service_matches=True, window_matches=True, supportive=True):
    return [{
        "source_id": sid,
        "available": True,
        "service_matches": service_matches,
        "window_matches": window_matches,
        "supports_requested_fact": supportive,
        "availability_bps": availability,
        "outage_intervals": [],
        "facts": ["historical service evidence"],
    } for sid in source_ids]


def mock_llm(vm, pattern, response):
    """Fill in the provider-neutral manifest if the test did not spell it out."""
    decoded = None
    try:
        decoded = json.loads(response) if isinstance(response, str) else None
    except (json.JSONDecodeError, TypeError):
        decoded = None
    if isinstance(decoded, dict):
        decoded.setdefault("service_matches", True)
        decoded.setdefault("window_matches", True)
        if "result" in decoded:
            ids = ["M1", "M2"]
        elif "outcome" in decoded:
            ids = ["M1", "M2", "X1", "C1"]
        else:
            ids = ["M1", "M2", "X1"]
        if "sources" not in decoded:
            decoded["sources"] = manifests(ids, decoded.get("measured_bps", 9900))
        response = json.dumps(decoded)
    vm.mock_llm(pattern, response)


def propose(vm, c, provider, customer, bond=2 * GEN):
    vm.sender = provider
    vm.value = bond
    vm.warp("2026-09-19T11:00:00Z")
    aid = c.create_agreement(
        hx(customer), "Payments API", "https://api.example.com", "availability", 9995, GEN,
        WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, SOURCE_POLICY, 1800,
    )
    vm.value = 0
    return aid


def create(vm, c, provider, customer, bond=2 * GEN):
    aid = propose(vm, c, provider, customer, bond)
    vm.sender = customer
    c.accept_agreement(aid)
    vm.warp("2026-09-19T13:00:00Z")
    return aid


def open_verified(vm, c, customer, aid, measured=9900):
    vm.sender = customer
    iid = c.open_incident(aid, measured, OBS_FROM, OBS_TO, EVIDENCE)
    vm.mock_web(r".*", {"status": 200, "body": "Payments API availability was 99.00% for the stated window."})
    mock_llm(vm, r".*", json.dumps({
        "result": "VERIFIED", "measured_bps": measured, "service_matches": True,
        "window_matches": True, "basis": "public probe establishes the metric",
    }))
    out = c.verify_measurement(iid)
    assert out["result"] == "VERIFIED"
    assert c.get_incident(iid)["status"] == "OPEN"
    assert c.get_incident(iid)["measurement_case_hash"]
    assert c.get_incident(iid)["measurement_evidence_digest"]
    vm.clear_mocks()
    return iid


def adjudicate(vm, c, iid, payload, body="upstream incident window matches the error window"):
    vm.mock_web(r".*", {"status": 200, "body": body})
    mock_llm(vm, r".*", json.dumps(payload))
    out = c.adjudicate_exception(iid)
    vm.clear_mocks()
    return out


# --------------------------------------------------------------------------
# Formation
# --------------------------------------------------------------------------

def test_create_freezes_clauses_and_escrows_bond(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    a = c.get_agreement(aid)
    assert a["id"] == "pc-a-1"
    assert a["provider"].lower() == hx(direct_alice).lower()
    assert a["customer"].lower() == hx(direct_bob).lower()
    assert len(a["exceptions"]) == 2
    assert a["status"] == "ACTIVE"
    assert int(a["accepted_at"]) < int(a["window_start"])
    stats = c.get_stats()
    assert stats["total_deposited"] == str(2 * GEN)
    assert stats["agreement_escrow"] == str(2 * GEN)
    assert stats["accounting_balanced"] is True
    assert stats["chain_id"] == "61999"
    assert stats["admin_controls"] is False


def test_provider_proposal_cannot_self_activate(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = propose(direct_vm, c, direct_alice, direct_bob)
    assert c.get_agreement(aid)["status"] == "PROPOSED"
    with direct_vm.expect_revert("only the named customer"):
        c.accept_agreement(aid)
    direct_vm.sender = direct_bob
    c.accept_agreement(aid)
    assert c.get_agreement(aid)["status"] == "ACTIVE"


def test_late_acceptance_expires_proposal_and_refunds_provider(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = propose(direct_vm, c, direct_alice, direct_bob)
    direct_vm.warp("2026-09-19T11:56:00Z")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("proposal is not open"):
        c.accept_agreement(aid)
    c.expire_proposal(aid)
    assert c.get_agreement(aid)["status"] == "EXPIRED"
    assert c.get_credit(hx(direct_alice)) == str(2 * GEN)
    stats = c.get_stats()
    assert stats["agreement_escrow"] == "0"
    assert stats["claimable"] == str(2 * GEN)
    assert stats["accounting_balanced"] is True


def test_agreement_cannot_be_created_once_formation_lead_is_lost(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = 2 * GEN
    direct_vm.warp("2026-09-19T11:55:00Z")
    with direct_vm.expect_revert("ten minutes for bilateral formation"):
        c.create_agreement(hx(direct_bob), "Payments API", "https://api.example.com", "availability", 9995, GEN,
                           WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, SOURCE_POLICY, 1800)
    assert c.get_stats()["total_deposited"] == "0"


def test_bond_must_cover_max_credit(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = GEN // 2
    direct_vm.warp("2026-09-19T11:00:00Z")
    with direct_vm.expect_revert("provider bond"):
        c.create_agreement(hx(direct_bob), "API", "https://api.example.com", "availability", 9995, GEN,
                           WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, SOURCE_POLICY, 1800)


def test_parties_must_be_distinct(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.value = 2 * GEN
    direct_vm.warp("2026-09-19T11:00:00Z")
    with direct_vm.expect_revert("distinct parties"):
        c.create_agreement(hx(direct_alice), "API", "https://api.example.com", "availability", 9995, GEN,
                           WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, SOURCE_POLICY, 1800)


def test_probe_cannot_live_inside_service_domain(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    policy = json.loads(SOURCE_POLICY)
    policy["measurement"][0]["host"] = "probe.api.example.com"
    direct_vm.sender = direct_alice
    direct_vm.value = 2 * GEN
    direct_vm.warp("2026-09-19T11:00:00Z")
    with direct_vm.expect_revert("independent probe origin"):
        c.create_agreement(hx(direct_bob), "API", "https://api.example.com", "availability", 9995, GEN,
                           WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, json.dumps(policy), 1800)


def test_duplicate_source_host_rejected_at_formation(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    policy = json.loads(SOURCE_POLICY)
    policy["measurement"][1]["host"] = "probe.example"
    direct_vm.sender = direct_alice
    direct_vm.value = 2 * GEN
    direct_vm.warp("2026-09-19T11:00:00Z")
    with direct_vm.expect_revert("multiple families"):
        c.create_agreement(hx(direct_bob), "API", "https://api.example.com", "availability", 9995, GEN,
                           WINDOW_START, WINDOW_END, EXCEPTIONS, POLICY_TEXT, json.dumps(policy), 1800)


# --------------------------------------------------------------------------
# Incident opening and measurement
# --------------------------------------------------------------------------

def test_only_customer_can_open_miss(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("only the customer"):
        c.open_incident(aid, 9900, OBS_FROM, OBS_TO, EVIDENCE)


def test_incident_requires_claimed_metric_below_target(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("measured SLA miss"):
        c.open_incident(aid, 9995, OBS_FROM, OBS_TO, EVIDENCE)


def test_untrusted_probe_label_cannot_bypass_frozen_policy(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    fake = json.dumps([
        {"kind": "INDEPENDENT_PROBE", "url": "https://attacker.example/incident", "note": "Self-labelled independent source."},
        {"kind": "STATUS_AGGREGATOR", "url": "https://status-archive.example/incident", "note": "Allowed archive."},
    ])
    with direct_vm.expect_revert("outside the frozen source policy"):
        c.open_incident(aid, 9900, OBS_FROM, OBS_TO, fake)


def test_evidence_kind_must_match_frozen_family(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    mislabelled = json.dumps([
        {"kind": "STATUS_AGGREGATOR", "url": "https://probe.example/incident", "note": "Probe origin wearing the aggregator family."},
        {"kind": "STATUS_AGGREGATOR", "url": "https://status-archive.example/incident", "note": "Allowed archive."},
    ])
    with direct_vm.expect_revert("does not match the frozen source family"):
        c.open_incident(aid, 9900, OBS_FROM, OBS_TO, mislabelled)


def test_frozen_source_path_prefix_is_enforced(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    mismatch = json.dumps([
        {"kind": "INDEPENDENT_PROBE", "url": "https://probe.example/private/incident", "note": "Path not covered at formation."},
        {"kind": "STATUS_AGGREGATOR", "url": "https://status-archive.example/incident", "note": "Allowed archive."},
    ])
    with direct_vm.expect_revert("outside the frozen source policy"):
        c.open_incident(aid, 9900, OBS_FROM, OBS_TO, mismatch)


def test_single_family_measurement_is_not_decisive(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    single = json.dumps([json.loads(EVIDENCE)[0]])
    with direct_vm.expect_revert("evidence must contain"):
        c.open_incident(aid, 9900, OBS_FROM, OBS_TO, single)


def test_measurement_verification_uses_substantive_validator_replay(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    iid = c.open_incident(aid, 9900, OBS_FROM, OBS_TO, EVIDENCE)
    direct_vm.mock_web(r".*", {"status": 200, "body": "availability 99.00 percent"})
    mock_llm(direct_vm, r".*", json.dumps({"result": "VERIFIED", "measured_bps": 9900, "service_matches": True, "window_matches": True, "basis": "matches"}))
    c.verify_measurement(iid)
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*", {"status": 200, "body": "availability 99.80 percent"})
    changed = manifests(["M1", "M2"])
    changed[1]["availability_bps"] = 9980
    mock_llm(direct_vm, r".*", json.dumps({"result": "VERIFIED", "measured_bps": 9900, "service_matches": True, "window_matches": True, "basis": "matches", "sources": changed}))
    assert direct_vm.run_validator() is False


def test_measurement_not_proven_releases_agreement(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    iid = c.open_incident(aid, 9900, OBS_FROM, OBS_TO, EVIDENCE)
    direct_vm.mock_web(r".*", {"status": 200, "body": "unrelated status page"})
    mock_llm(direct_vm, r".*", json.dumps({"result": "NOT_PROVEN", "measured_bps": 0, "service_matches": False, "window_matches": False, "basis": "wrong service"}))
    c.verify_measurement(iid)
    assert c.get_incident(iid)["status"] == "MEASUREMENT_REJECTED"
    assert c.get_agreement(aid)["incident_id"] == ""


def test_measurement_source_unavailable_retries_then_dismisses(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    iid = c.open_incident(aid, 9900, OBS_FROM, OBS_TO, EVIDENCE)
    direct_vm.mock_web(r".*", {"status": 200, "body": ""})
    out = c.verify_measurement(iid)
    assert out["result"] == "SOURCE_UNAVAILABLE"
    assert c.get_incident(iid)["status"] == "MEASUREMENT_INCONCLUSIVE"
    with direct_vm.expect_revert("retry window is still open"):
        c.dismiss_unproven_measurement(iid)
    direct_vm.warp("2026-09-19T20:01:00Z")
    c.dismiss_unproven_measurement(iid)
    assert c.get_incident(iid)["status"] == "MEASUREMENT_REJECTED"
    assert c.get_agreement(aid)["incident_id"] == ""


# --------------------------------------------------------------------------
# Exception claim and adjudication
# --------------------------------------------------------------------------

def test_measurement_must_verify_before_exception_claim(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    iid = c.open_incident(aid, 9900, OBS_FROM, OBS_TO, EVIDENCE)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("provider cannot claim"):
        c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)


def test_unfrozen_clause_is_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("not frozen in this agreement"):
        c.claim_exception(iid, "FORCE_MAJEURE", EXCEPTION_EVIDENCE)


def test_not_proven_exception_becomes_full_liability(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    out = adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "impact predates the upstream failure"})
    assert out["status"] == "NOT_PROVEN"
    assert c.get_incident(iid)["liable_bps"] == "10000"
    assert direct_vm.run_validator() is True


def test_validator_detects_different_exception_judgment(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    out = adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "not proven"})
    assert out["status"] == "NOT_PROVEN"
    direct_vm.mock_web(r".*", {"status": 200, "body": "different page"})
    mock_llm(direct_vm, r".*", json.dumps({"status": "PROVEN", "service_matches": True, "window_matches": True, "causal_match": True, "basis": "proven"}))
    assert direct_vm.run_validator() is False


def test_exception_source_unavailable_never_becomes_proven(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    direct_vm.mock_web(r".*", {"status": 200, "body": ""})
    out = c.adjudicate_exception(iid)
    assert out["status"] == "SOURCE_UNAVAILABLE"
    assert c.get_incident(iid)["status"] == "INCONCLUSIVE"


def test_partial_relief_computes_deterministic_liability(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    out = adjudicate(direct_vm, c, iid, {
        "status": "PARTIAL", "service_matches": True, "window_matches": True, "causal_match": True,
        "excused_intervals": [{"from_ts": OBS_FROM + 1800, "to_ts": OBS_TO, "evidence_ids": ["X1"]}],
        "basis": "upstream failure covers the second half of the observation",
    })
    assert out["liable_bps"] == 5000
    assert c.get_incident(iid)["status"] == "PENDING"
    assert c.get_incident(iid)["challenge_deadline"] != "0"


# --------------------------------------------------------------------------
# Settlement
# --------------------------------------------------------------------------

def test_unanswered_incident_defaults_to_full_breach(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.warp("2026-09-19T14:01:00Z")
    direct_vm.sender = direct_bob
    out = c.finalize_default_breach(iid)
    assert out["liable_bps"] == 10000
    assert c.get_incident(iid)["status"] == "FINAL"
    assert c.get_agreement(aid)["status"] == "CLOSED"
    assert c.get_credit(hx(direct_bob)) == str(GEN)
    assert c.get_credit(hx(direct_alice)) == str(GEN)
    stats = c.get_stats()
    assert stats["finalized_breaches"] == 1
    assert stats["accounting_balanced"] is True


def test_proven_exception_returns_full_bond(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    out = adjudicate(direct_vm, c, iid, {"status": "PROVEN", "service_matches": True, "window_matches": True, "causal_match": True, "basis": "frozen clause established"})
    assert out["liable_bps"] == 0
    direct_vm.warp("2026-09-19T13:31:00Z")
    direct_vm.sender = direct_bob
    c.finalize_incident(iid)
    assert c.get_incident(iid)["status"] == "FINAL"
    assert c.get_credit(hx(direct_alice)) == str(2 * GEN)
    assert c.get_credit(hx(direct_bob)) == "0"
    stats = c.get_stats()
    assert stats["proven_exceptions"] == 1
    assert stats["accounting_balanced"] is True


def test_inconclusive_retry_window_closes_neutrally(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    direct_vm.mock_web(r".*", {"status": 200, "body": ""})
    c.adjudicate_exception(iid)
    direct_vm.clear_mocks()
    assert c.get_incident(iid)["status"] == "INCONCLUSIVE"
    with direct_vm.expect_revert("still open"):
        c.finalize_default_breach(iid)
    direct_vm.warp("2026-09-20T14:02:00Z")
    out = c.finalize_default_breach(iid)
    assert out["no_decision"] is True
    assert c.get_incident(iid)["exception_result"] == "INCONCLUSIVE_FINAL"
    assert c.get_credit(hx(direct_alice)) == str(2 * GEN)
    assert c.get_stats()["accounting_balanced"] is True


# --------------------------------------------------------------------------
# Challenge lifecycle
# --------------------------------------------------------------------------

def test_challenge_requires_bond_and_party_role(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "not proven"})
    direct_vm.sender = direct_alice
    direct_vm.value = 10 ** 13  # below the minimum stake
    with direct_vm.expect_revert("challenge bond"):
        c.challenge_exception(iid, "The observation window is attributed to the wrong service.", "https://counter.example/evidence/1")
    direct_vm.value = 10 ** 14
    direct_vm.sender = create_address()
    with direct_vm.expect_revert("bound parties"):
        c.challenge_exception(iid, "The observation window is attributed to the wrong service.", "https://counter.example/evidence/1")


def test_upheld_challenge_revises_finding_and_returns_bond(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "not proven"})
    direct_vm.sender = direct_alice
    stake = 10 ** 14
    direct_vm.value = stake
    c.challenge_exception(iid, "The adjudication window attribution contradicts the first-failure records.", "https://counter.example/evidence/1")
    direct_vm.value = 0
    stats = c.get_stats()
    assert stats["challenge_escrow"] == str(stake)
    direct_vm.mock_web(r".*", {"status": 200, "body": "first failure records match the frozen window"})
    mock_llm(direct_vm, r".*", json.dumps({
        "outcome": "UPHELD", "revised_status": "PROVEN", "service_matches": True, "window_matches": True,
        "basis": "first failure timestamps prove causation",
        "sources": manifests(["M1", "M2", "X1", "C1"]),
    }))
    out = c.resolve_challenge(iid)
    assert out["outcome"] == "UPHELD"
    assert c.get_incident(iid)["exception_result"] == "PROVEN"
    assert c.get_incident(iid)["liable_bps"] == "0"
    assert c.get_credit(hx(direct_alice)) == str(stake)
    assert c.get_stats()["challenge_escrow"] == "0"
    assert c.get_stats()["accounting_balanced"] is True


def test_rejected_challenge_awards_counterparty(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "not proven"})
    direct_vm.sender = direct_alice
    stake = 10 ** 14
    direct_vm.value = stake
    c.challenge_exception(iid, "The adjudication window attribution contradicts the first-failure records.", "https://counter.example/evidence/1")
    direct_vm.value = 0
    direct_vm.mock_web(r".*", {"status": 200, "body": "records contradict the challenge"})
    mock_llm(direct_vm, r".*", json.dumps({
        "outcome": "REJECTED", "service_matches": True, "window_matches": True,
        "basis": "challenge evidence does not support a revision",
        "sources": manifests(["M1", "M2", "X1", "C1"]),
    }))
    out = c.resolve_challenge(iid)
    assert out["outcome"] == "REJECTED"
    assert c.get_credit(hx(direct_bob)) == str(stake)
    assert c.get_incident(iid)["liable_bps"] == "10000"
    assert c.get_stats()["accounting_balanced"] is True


def test_stalled_challenge_expires_and_allows_finalization(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    iid = open_verified(direct_vm, c, direct_bob, aid)
    direct_vm.sender = direct_alice
    c.claim_exception(iid, "UPSTREAM", EXCEPTION_EVIDENCE)
    adjudicate(direct_vm, c, iid, {"status": "NOT_PROVEN", "service_matches": True, "window_matches": True, "causal_match": False, "basis": "not proven"})
    direct_vm.sender = direct_alice
    stake = 10 ** 14
    direct_vm.value = stake
    c.challenge_exception(iid, "The adjudication window attribution contradicts the first-failure records.", "https://counter.example/evidence/1")
    direct_vm.value = 0
    with direct_vm.expect_revert("must resolve first"):
        c.finalize_incident(iid)
    direct_vm.warp("2026-09-20T13:31:00Z")
    c.expire_challenge(iid)
    assert json.loads(c.get_incident(iid)["challenge"])["status"] == "EXPIRED"
    assert c.get_credit(hx(direct_alice)) == str(stake)
    direct_vm.warp("2026-09-20T13:32:00Z")
    c.finalize_incident(iid)
    assert c.get_incident(iid)["status"] == "FINAL"
    assert c.get_stats()["accounting_balanced"] is True


# --------------------------------------------------------------------------
# Credits, expiry, reads
# --------------------------------------------------------------------------

def test_withdraw_moves_credit_only_to_owner(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    propose(direct_vm, c, direct_alice, direct_bob)
    direct_vm.warp("2026-09-19T11:56:00Z")
    c.expire_proposal("pc-a-1")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("your own wallet"):
        c.withdraw_credit(hx(direct_alice))
    direct_vm.sender = direct_alice
    c.withdraw_credit(hx(direct_alice))
    assert c.get_credit(hx(direct_alice)) == "0"
    stats = c.get_stats()
    assert stats["withdrawn"] == str(2 * GEN)
    assert stats["accounting_balanced"] is True


def test_clean_window_expiry_returns_bond(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    aid = create(direct_vm, c, direct_alice, direct_bob)
    with direct_vm.expect_revert("cannot expire yet"):
        c.expire_agreement(aid)
    direct_vm.warp("2026-09-22T10:00:00Z")
    direct_vm.sender = direct_bob
    c.expire_agreement(aid)
    assert c.get_agreement(aid)["status"] == "EXPIRED"
    assert c.get_credit(hx(direct_alice)) == str(2 * GEN)


def test_pagination_and_read_surface(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy)
    create(direct_vm, c, direct_alice, direct_bob)
    page = c.list_agreements(0, 10)
    assert page["total"] == 1
    assert page["order"] == ["pc-a-1"]
    empty = c.list_incidents(0, 10)
    assert empty["total"] == 0
    with direct_vm.expect_revert("invalid pagination"):
        c.list_agreements(-1, 10)
    with direct_vm.expect_revert("agreement not found"):
        c.get_agreement("pc-a-99")


def test_stats_surface_is_release_lockable(direct_vm, direct_deploy, direct_alice):
    c = deploy(direct_deploy)
    stats = c.get_stats()
    assert stats["network"] == "Studionet"
    assert stats["rpc"] == "https://studio.genlayer.com/api"
    assert stats["version"].endswith("-studionet")
