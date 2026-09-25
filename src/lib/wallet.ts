import { useCallback, useEffect, useState } from "react";
import { CHAIN_HEX, CHAIN_ID, NETWORK } from "./config";

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, handler: (...args: any[]) => void): void;
  removeListener?(event: string, handler: (...args: any[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function provider(): Eip1193Provider | null {
  return typeof window === "undefined" ? null : window.ethereum || null;
}

export function normalizeAccounts(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

/** Switch (or add) Studionet 61999 on the injected wallet. */
export async function ensureStudionet(): Promise<void> {
  const p = provider();
  if (!p) throw new Error("Open an injected EIP-1193 wallet (MetaMask or compatible) to continue");
  const current = await p.request({ method: "eth_chainId" });
  if (typeof current === "string" && parseInt(current, 16) === CHAIN_ID) return;
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;
    await p.request({ method: "wallet_addEthereumChain", params: [NETWORK] });
  }
}

export interface WalletState {
  ready: boolean;
  address: string | null;
  chainId: number | null;
  connected: boolean;
  correctNetwork: boolean;
  connect: () => Promise<string>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

export function useInjectedWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [off, setOff] = useState(false);

  const refresh = useCallback(async () => {
    const p = provider();
    if (!p) {
      setAddress(null);
      setChainId(null);
      setReady(true);
      return;
    }
    const [accounts, chain] = await Promise.all([
      p.request({ method: "eth_accounts" }).catch(() => []),
      p.request({ method: "eth_chainId" }).catch(() => null),
    ]);
    setAddress(off ? null : normalizeAccounts(accounts)[0] || null);
    setChainId(typeof chain === "string" ? parseInt(chain, 16) : null);
    setReady(true);
  }, [off]);

  useEffect(() => {
    refresh();
    const p = provider();
    if (!p?.on) return;
    const handler = () => refresh();
    p.on("accountsChanged", handler);
    p.on("chainChanged", handler);
    return () => {
      p.removeListener?.("accountsChanged", handler);
      p.removeListener?.("chainChanged", handler);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    const p = provider();
    if (!p) throw new Error("No injected EIP-1193 wallet found. Install MetaMask or a compatible wallet.");
    setOff(false);
    const accounts = normalizeAccounts(await p.request({ method: "eth_requestAccounts" }));
    if (!accounts[0]) throw new Error("Wallet returned no account");
    await ensureStudionet();
    setAddress(accounts[0]);
    setChainId(CHAIN_ID);
    return accounts[0];
  }, []);

  return {
    ready,
    address,
    chainId,
    connected: !!address,
    correctNetwork: chainId === CHAIN_ID,
    connect,
    switchNetwork: ensureStudionet,
    disconnect: () => {
      setOff(true);
      setAddress(null);
    },
    refresh,
  };
}
