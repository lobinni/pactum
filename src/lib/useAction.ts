import { useState } from "react";
import { write, waitFinal } from "./contract";
import { useWallet } from "../components/WalletContext";
import type { TxState } from "../components/TxNotice";

export interface ActionRunner {
  state: TxState;
  busy: boolean;
  run: (functionName: string, args?: any[], valueWei?: bigint) => Promise<boolean>;
  reset: () => void;
}

/**
 * Signed-write runner: connects/guards the wallet, submits through the
 * injected provider, waits for FINALIZED and reports staged progress.
 */
export function useAction(onSettled?: () => void): ActionRunner {
  const wallet = useWallet();
  const [state, setState] = useState<TxState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  const run = async (functionName: string, args: any[] = [], valueWei?: bigint): Promise<boolean> => {
    setBusy(true);
    try {
      let signer = wallet.address;
      if (!signer) {
        setState({ kind: "pending", stage: "awaiting wallet connection" });
        signer = await wallet.connect();
      }
      if (!wallet.correctNetwork) {
        await wallet.switchNetwork();
      }
      if (!signer) throw new Error("Connect a wallet on Studionet to continue");
      setState({ kind: "pending", stage: "awaiting your signature" });
      const hash = await write(signer, functionName, args, valueWei);
      setState({ kind: "pending", hash, stage: "submitted — awaiting consensus finality" });
      const { status } = await waitFinal(hash, (stage) =>
        setState({ kind: "pending", hash, stage: `consensus stage: ${stage.toLowerCase()}` }),
      );
      setState({ kind: "finalized", hash, detail: status.toLowerCase() });
      onSettled?.();
      return true;
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ? String(e.message).slice(0, 260) : "The transaction could not be submitted" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, run, reset: () => setState({ kind: "idle" }) };
}
