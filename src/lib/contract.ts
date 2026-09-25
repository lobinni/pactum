import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant, TransactionStatus } from "genlayer-js/types";
import { CONTRACT_ADDRESS, assertReleaseConfig } from "./config";
import { provider } from "./wallet";
import { assertContractAddress, assertWriteWallet } from "./walletGuard";

assertReleaseConfig();

/** Read-only client over the studio gateway (no wallet involved). */
export function readClient() {
  return createClient({ chain: studionet });
}

export function requireContract(): `0x${string}` {
  assertContractAddress(CONTRACT_ADDRESS);
  return CONTRACT_ADDRESS as `0x${string}`;
}

function writeClient(address: string) {
  const p = provider();
  if (!p) throw new Error("PACTUM: no injected EIP-1193 wallet available.");
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address))
    throw new Error("PACTUM: connected wallet address is missing or invalid.");
  return createClient({ chain: studionet, account: address as `0x${string}`, provider: p as any });
}

export function writeWithClient(
  client: { writeContract: (request: any) => Promise<unknown> },
  walletAddress: `0x${string}`,
  contractAddress: `0x${string}`,
  functionName: string,
  args: any[] = [],
  value?: bigint,
) {
  const jsonRpcAccount = { address: walletAddress, type: "json-rpc" as const };
  return client.writeContract({
    account: jsonRpcAccount,
    address: contractAddress,
    functionName,
    args,
    value: value ?? 0n,
  } as any);
}

/** Public view call against the canonical deployment. */
export async function read(functionName: string, args: any[] = []): Promise<any> {
  return readClient().readContract({
    address: requireContract(),
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    jsonSafeReturn: true,
  } as any);
}

/**
 * Signed write. The wallet is revalidated (account + chain 61999) immediately
 * before the signature request.
 */
export async function write(
  address: string,
  functionName: string,
  args: any[] = [],
  value?: bigint,
): Promise<string> {
  const p = provider();
  if (!p) throw new Error("PACTUM: no injected EIP-1193 wallet available.");
  const [chain, accounts] = await Promise.all([
    p.request({ method: "eth_chainId" }),
    p.request({ method: "eth_accounts" }),
  ]);
  assertWriteWallet(chain, accounts, address);
  const contractAddress = requireContract();
  const client = writeClient(address);
  const hash = (await writeWithClient(
    client as any,
    address as `0x${string}`,
    contractAddress,
    functionName,
    args,
    value,
  )) as string;
  return hash;
}

/** Wait for a transaction to reach FINALIZED, with progress callbacks. */
export async function waitFinal(
  hash: string,
  onUpdate?: (status: string) => void,
): Promise<{ status: string; receipt: any }> {
  const client = readClient() as any;
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 240,
    interval: 5000,
    onStatusChange: (status: string) => onUpdate?.(String(status)),
  });
  const status =
    receipt?.txExecutionResultName || receipt?.statusName || "FINALIZED";
  return { status: String(status), receipt };
}

/* -------------------------------------------------------------- reads --- */

export async function getStats(): Promise<any> {
  return read("get_stats", []);
}

export async function listAgreements(offset: number, limit: number): Promise<any> {
  return read("list_agreements", [offset, limit]);
}

export async function getAgreement(id: string): Promise<any> {
  return read("get_agreement", [id]);
}

export async function listIncidents(offset: number, limit: number): Promise<any> {
  return read("list_incidents", [offset, limit]);
}

export async function getIncident(id: string): Promise<any> {
  return read("get_incident", [id]);
}

export async function getCredit(address: string): Promise<string> {
  return read("get_credit", [address]);
}
