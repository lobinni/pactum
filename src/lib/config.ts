/**
 * PACTUM release configuration — the ONLY module that binds the app to a
 * network and a deployed contract.
 *
 * Rotating the deployment address:
 *   1. Preferred: build with  VITE_PACTUM_CONTRACT=0x... npm run build
 *      (deploy/deployScript.ts writes .env.local automatically).
 *   2. Or change the single PACTUM_CONTRACT fallback constant below.
 *
 * Everything else in the app imports from here; no other file may hardcode
 * an address, chain ID or RPC endpoint. docs/CONFIGURATION.md has the full
 * procedure, and scripts/check_release.py verifies the wiring.
 */

export const CHAIN_ID = 61999;
export const CHAIN_HEX = "0x" + CHAIN_ID.toString(16);
export const RPC = "https://studio.genlayer.com/api";
export const EXPLORER = "https://explorer-studio.genlayer.com";

/** Fallback canonical address (release 1.0.0-studionet). */
const PACTUM_CONTRACT = "0x5c0215CCbd74D4270eF1bf3aF17F43C78B3851dc";

const envContract = (import.meta as any).env?.VITE_PACTUM_CONTRACT as string | undefined;

export const CONTRACT_ADDRESS =
  envContract && /^0x[0-9a-fA-F]{40}$/.test(envContract) ? envContract : PACTUM_CONTRACT;

export const IS_DEPLOYED = /^0x(?!0{40})[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS);

export const NETWORK = {
  chainId: CHAIN_HEX,
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC],
  blockExplorerUrls: [EXPLORER],
};

export function addressExplorer(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

export function txExplorer(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function assertReleaseConfig(): void {
  const envId = Number((import.meta as any).env?.VITE_GENLAYER_CHAIN_ID || CHAIN_ID);
  const envRpc = ((import.meta as any).env?.VITE_GENLAYER_RPC_URL as string | undefined) || RPC;
  if (envId !== CHAIN_ID || envRpc !== RPC) {
    throw new Error("PACTUM is locked to Studionet 61999 / studio.genlayer.com/api");
  }
}
