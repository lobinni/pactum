const CHAIN_ID = 61999;

/** Revalidate the injected wallet immediately before asking it to sign. */
export function assertWriteWallet(chainId: unknown, accounts: unknown, account: string): void {
  if (typeof account !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(account)) {
    throw new Error("PACTUM: connected wallet address is missing or invalid. Reconnect an EIP-1193 wallet account.");
  }
  if (typeof chainId !== "string" || !/^0x[0-9a-fA-F]+$/.test(chainId) || Number.parseInt(chainId, 16) !== CHAIN_ID) {
    throw new Error("PACTUM: wallet network changed. Switch to GenLayer Studionet (61999) before signing.");
  }
  if (
    !Array.isArray(accounts) ||
    typeof accounts[0] !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(accounts[0]) ||
    accounts[0].toLowerCase() !== account.toLowerCase()
  ) {
    throw new Error("PACTUM: connected wallet account changed or is invalid. Reconnect the intended account before signing.");
  }
}

export function assertContractAddress(address: unknown): asserts address is `0x${string}` {
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("PACTUM: canonical contract address is missing or invalid. Check the release configuration.");
  }
}
