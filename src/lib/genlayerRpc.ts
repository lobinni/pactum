import { RPC } from "./config";

/** Minimal JSON-RPC gateway client for the studio endpoint. */
export async function genRpc<T>(method: string, params: unknown[], request: typeof fetch = fetch): Promise<T> {
  const response = await request(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`GenLayer RPC HTTP ${response.status}`);
  const body = (await response.json()) as { error?: { message?: string } | unknown; result?: T };
  if (body.error) {
    const error = body.error as { message?: string };
    throw new Error(error.message ?? JSON.stringify(body.error));
  }
  return body.result as T;
}

export type GenLayerReceipt = {
  status?: number | string;
  statusName?: string;
  result?: number | string;
  txExecutionResult?: number | string;
  txExecutionResultName?: string;
  consensus_data?: { leader_receipt?: unknown };
  [key: string]: unknown;
};

export async function getTransactionReceipt(txId: string, request: typeof fetch = fetch) {
  return genRpc<GenLayerReceipt>("gen_getTransactionReceipt", [{ txId }], request);
}

export async function getTransactionStatus(txId: string, request: typeof fetch = fetch) {
  return genRpc<unknown>("gen_getTransactionStatus", [txId], request);
}
