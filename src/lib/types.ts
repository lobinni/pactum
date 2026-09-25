/** Shared protocol document shapes (JSON documents stored on-chain). */

export interface FrozenClause {
  code: string;
  title: string;
  rule: string;
  proof: string;
}

export interface PolicyEntry {
  kind: string;
  host: string;
  path_prefix: string;
  retrieval_mode: string;
}

export interface SourcePolicy {
  measurement: PolicyEntry[];
  exception: PolicyEntry[];
  challenge: PolicyEntry[];
}

export interface EvidenceItem {
  id: string;
  kind: string;
  url: string;
  note: string;
}

export interface Agreement {
  id: string;
  provider: string;
  customer: string;
  service_name: string;
  service_url: string;
  metric_name: string;
  target_bps: number;
  max_credit_atto: string;
  window_start: string;
  window_end: string;
  exceptions: FrozenClause[];
  evidence_policy: string;
  source_policy: SourcePolicy;
  spec_hash: string;
  bond_atto: string;
  challenge_window_seconds: string;
  status: string;
  formation_deadline: string;
  accepted_at: string;
  incident_id: string;
  created_at: string;
  expired_at?: string;
}

export interface Challenge {
  challenger: string;
  statement: string;
  evidence: EvidenceItem[];
  bond_atto: string;
  status: string;
  opened_at: string;
  basis: string;
  resolution_deadline: string;
  resolved_at: string;
  checked_at: string;
}

export interface ExcusedInterval {
  from_ts: number;
  to_ts: number;
  evidence_ids?: string[];
}

export interface Incident {
  id: string;
  agreement_id: string;
  claimed_actual_bps: string;
  actual_bps: string;
  observed_from: string;
  observed_to: string;
  measurement_evidence: EvidenceItem[];
  measurement_case_hash: string;
  measurement_basis: string;
  status: string;
  exception_code: string;
  exception_evidence: EvidenceItem[];
  exception_result: string;
  liable_bps: string;
  excused_intervals: ExcusedInterval[];
  basis: string;
  challenge_deadline: string;
  challenge: string;
  opened_at: string;
  response_deadline: string;
  resolution_deadline: string;
  measurement_deadline: string;
  measurement_verified_at: string;
  adjudicated_at: string;
  finalized_at: string;
  payout_atto?: string;
}

export interface ProtocolStats {
  version: string;
  network: string;
  chain_id: string;
  rpc: string;
  agreements: number;
  incidents: number;
  finalized_breaches: number;
  proven_exceptions: number;
  total_deposited: string;
  agreement_escrow: string;
  challenge_escrow: string;
  claimable: string;
  withdrawn: string;
  accounting_balanced: boolean;
  admin_controls: boolean;
}
