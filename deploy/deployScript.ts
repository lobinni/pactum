import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import {
  ExecutionResult,
  TransactionStatus,
  type DecodedDeployData,
  type GenLayerClient,
  type GenLayerChain,
  type TransactionHash,
} from "genlayer-js/types";

/**
 * PACTUM deployment script.
 *
 * Hard-locked to GenLayer Studionet: chain 61999 over
 * https://studio.genlayer.com/api. Deploys contracts/pactum.py, waits for a
 * FINALIZED receipt, verifies the release network reported by the contract,
 * then writes deployments/studionet.json and the frontend address env.
 *
 * The contract address is intentionally stored in exactly two generated
 * places (deployments/studionet.json and frontend .env), so rotating a
 * deployment never requires editing application code.
 */

const EXPECTED_CHAIN = 61999;
const EXPECTED_RPC = "https://studio.genlayer.com/api";
const EXPECTED_EXPLORER = "https://explorer-studio.genlayer.com";

export default async function main(client: GenLayerClient<any>) {
  const chain = client.chain as GenLayerChain;
  if (chain.id !== EXPECTED_CHAIN) throw new Error("PACTUM is locked to Studionet 61999");
  if (chain.rpcUrls.default.http[0] !== EXPECTED_RPC)
    throw new Error("PACTUM deploy RPC must be https://studio.genlayer.com/api");

  const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), "contracts/pactum.py")));
  const sourceSha256 = createHash("sha256").update(code).digest("hex");

  const tx = await client.deployContract({ code, args: [] });
  const receipt = await client.waitForTransactionReceipt({
    hash: tx as TransactionHash,
    status: TransactionStatus.FINALIZED,
    retries: 240,
    interval: 15000,
  });
  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN)
    throw new Error(`Deployment failed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);

  const address =
    (receipt.txDataDecoded as DecodedDeployData)?.contractAddress || receipt.data?.contract_address;
  if (!address) throw new Error("No contract address in finalized receipt");

  const stats = (await client.readContract({
    address: address as `0x${string}`,
    functionName: "get_stats",
    args: [],
  })) as any;
  if (String(stats?.chain_id) !== String(EXPECTED_CHAIN) || stats?.rpc !== EXPECTED_RPC)
    throw new Error("Deployed contract reports the wrong release network");

  mkdirSync(path.resolve(process.cwd(), "deployments"), { recursive: true });
  writeFileSync(
    path.resolve(process.cwd(), "deployments/studionet.json"),
    JSON.stringify(
      {
        product: "PACTUM",
        network: "studionet",
        networkName: "GenLayer Studionet",
        chainId: EXPECTED_CHAIN,
        rpc: EXPECTED_RPC,
        explorer: EXPECTED_EXPLORER,
        source: { path: "contracts/pactum.py", sha256: sourceSha256 },
        constructorArgs: [],
        deployedAt: new Date().toISOString(),
        deployment: {
          version: "1.0.0-studionet",
          status: receipt.statusName,
          executionResult: receipt.txExecutionResultName,
          address,
          txHash: tx,
          explorerAddress: `${EXPECTED_EXPLORER}/address/${address}`,
          explorerTransaction: `${EXPECTED_EXPLORER}/tx/${tx}`,
        },
      },
      null,
      2,
    ) + "\n",
  );

  // Single-source address handoff to the web application. The frontend reads
  // VITE_PACTUM_CONTRACT at build time and falls back to src/lib/config.ts.
  writeFileSync(
    path.resolve(process.cwd(), ".env.local"),
    [
      `VITE_PACTUM_CONTRACT=${address}`,
      `VITE_GENLAYER_CHAIN_ID=${EXPECTED_CHAIN}`,
      `VITE_GENLAYER_RPC_URL=${EXPECTED_RPC}`,
      `VITE_GENLAYER_EXPLORER=${EXPECTED_EXPLORER}`,
      "",
    ].join("\n"),
  );

  console.log("PACTUM finalized on Studionet:", address);
  console.log("tx:", tx);
}
