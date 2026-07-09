# Ponytail debt ledger

Deliberate shortcuts marked with `ponytail:` comments. Regenerate with `/ponytail:ponytail-debt`.

## src/lib/auth.ts
- **:110** — JWKS fetch timeout raised from 3s default to 15s.
  - ceiling: 3s default aborts JWKS fetch on cold dev start.
  - upgrade: revisit if 15s masks a real network fault, or drop toward default once JWKS is warm in prod.
  - status: kept — a calibration knob (real cold-start latency), not code to delete.

## Resolved
- ~~src/lib/postman.ts formdata bodies~~ — text formdata fields now import as a JSON object; file fields skipped.

1 marker, 0 with no trigger.
