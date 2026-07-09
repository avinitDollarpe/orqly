# Ponytail debt ledger

Deliberate shortcuts marked with `ponytail:` comments. Regenerate with `/ponytail:ponytail-debt`.

## src/lib/postman.ts
- **:83** — formdata/file request bodies not parsed; those requests import with no body.
  - ceiling: multipart (formdata/file) bodies unsupported.
  - upgrade: add multipart parsing when a user imports a collection whose requests rely on formdata.

## src/lib/auth.ts
- **:110** — JWKS fetch timeout raised from 3s default to 15s.
  - ceiling: 3s default aborts JWKS fetch on cold dev start.
  - upgrade: revisit if 15s masks a real network fault, or drop toward default once JWKS is warm in prod.

2 markers, 0 with no trigger.
