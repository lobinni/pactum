# Deployments

`studionet.json` is the single canonical record for every PACTUM release on
GenLayer Studionet (chain `61999`).

## How the address flows

1. `deploy/deployScript.ts` deploys `contracts/pactum.py`, waits for a
   `FINALIZED` receipt, verifies `get_stats()` reports chain `61999` and the
   studio RPC, then updates:
   - `deployments/studionet.json` → `canonicalDeployment.address`
   - `.env.local` → `VITE_PACTUM_CONTRACT=<address>`
2. The web application resolves the active address in
   `src/lib/config.ts`:
   - first from the build-time env `VITE_PACTUM_CONTRACT`,
   - otherwise from the `PACTUM_CONTRACT` fallback constant in that file.

To repoint the application at a different deployment, change **one** value:
either rebuild with `VITE_PACTUM_CONTRACT` set, or edit the fallback constant
in `src/lib/config.ts`. No other file hardcodes an address.

Older addresses are retained under `historicalDeployments` for provenance
only and must never be wired into current application code.
