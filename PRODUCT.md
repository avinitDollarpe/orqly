# Product

## Register

product

## Platform

web

## Users

Developers, QA engineers and technical PMs who chain multiple API calls to test
real backend flows (e.g. Create Customer → Share KYC → Create Payout). They
arrive with a Postman collection, an OpenAPI spec or a cURL command and want to
see the whole flow run visually instead of firing requests one at a time. They
work in dark IDEs and terminals; Orqly is one more pro tool on that desk.

## Product Purpose

Orqly is a node-based visual editor for building, testing and simulating API
workflows: each node is one request, edges define execution order, and any
node's response feeds later requests via `{{nodes.…}}` templates. Success is a
tester importing their collection, arranging nodes, and watching a multi-step
flow run green end-to-end in minutes. Currently in private beta behind a
waitlist + invite passcode.

## Brand Personality

Premium, dark, trading-desk. The Ostium-inspired look carried further: dense
glass panels over a near-black canvas, one orange voltage line through
everything, mono type for anything machine-shaped (methods, URLs, statuses).
Feels like a professional instrument, not a toy — calm surfaces, precise
signals, no decoration without information.

## Anti-references

- Generic SaaS template: cream hero, gradient text, identical feature-card
  grids, Postman's utilitarian gray density.
- Enterprise dashboard: blue-gray chrome, dense tables, Jira/ServiceNow
  heaviness.
- Dev-terminal cliché: matrix-green on black, ASCII borders, hacker cosplay.

## Design Principles

1. **The canvas is the brand.** Nodes, method chips, run statuses and wired
   edges are the identity; marketing surfaces borrow the product's vocabulary,
   never a separate template language.
2. **Color is information.** Method hues (GET green, POST orange, …) and run
   statuses own their colors; decoration never competes with signal. Orange is
   the single accent everywhere else.
3. **Mono means machine.** JetBrains Mono marks anything the system owns —
   URLs, codes, statuses, section labels; Jakarta carries human-facing prose.
4. **Calm glass, loud moments.** Surfaces stay quiet and dark; motion and glow
   are spent on one thing at a time (a running edge, a breathing glow).
5. **Every state teaches.** Empty, error and skipped states use the product's
   own grammar (chips, statuses) to tell the user what happens next.

## Accessibility & Inclusion

WCAG AA: ≥4.5:1 body-text contrast, ≥3:1 for large text; visible keyboard
focus everywhere (focus-visible rings already in place); every animation
respects `prefers-reduced-motion`; `prefers-reduced-transparency` swaps glass
for opaque surfaces (already implemented).
