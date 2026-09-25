# Sample payloads (live manual testing)

These files are the reference pack for `docs/MANUAL_TESTING.md`. They contain
no demo data for the UI — the application always reads and writes the live
Studionet deployment. The samples are realistic, coherent example values you
type into the structured forms, plus the exact argument sets the contract
receives, so a reviewer can cross-check every step.

## Files

| File | Used in step | Purpose |
| --- | --- | --- |
| `01-agreement.acme-edge.json` | Formation | Every form field for a complete agreement, plus the serialized call arguments |
| `02-measurement-incident.json` | Incident opening | Claimed availability, observation window rule, measurement evidence items |
| `03-exception-claim.json` | Exception claim | The frozen clause code and its evidence items |
| `04-challenge.json` | Challenge | Statement, evidence URL and stake |

## Conventions

- Every URL must be HTTPS and sit under an origin frozen in the agreement's
  source policy; replace the illustrative hosts with real, stable,
  non-redirecting public pages before running live.
- Time values are given as offsets (for example `NOW + 24h`); the form asks
  for minutes, and the observation pickers take local date/time values that
  are converted to Unix seconds on submission.
- GEN amounts are decimal strings; the interface converts them to atto-GEN.
- Availability targets are shown as percentages in the UI and frozen as basis
  points on-chain (99.90% → 9990).
