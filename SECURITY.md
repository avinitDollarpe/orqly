# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Report privately via GitHub's [Security Advisories](https://github.com/avinitDollarpe/orqly/security/advisories/new)
("Report a vulnerability"). Include steps to reproduce and impact. Expect an
acknowledgement within a few days.

## Scope worth flagging

orqly proxies user-supplied HTTP requests through `/api/execute`. Areas of
particular interest:

- SSRF / requests to internal addresses (mitigated by `EXECUTE_BLOCK_PRIVATE_IPS`
  — see the README).
- Auth/session handling (Better Auth).
- Template interpolation (`{{env.…}}`, `{{nodes.…}}`) and the pre-request
  script sandbox.

## Supported versions

This is a young project; only the latest `main` is supported.
