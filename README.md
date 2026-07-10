<div align="center">

<img src="src/app/icon.svg" alt="orqly logo" width="88" height="88">

# orqly

**Build, test and simulate complex API workflows in a node-based visual editor.**

Chain API calls as connected nodes, pipe any node's response into a later request, and watch the whole flow run step by step.

[![License: MIT](https://img.shields.io/badge/License-MIT-1e1e1f?labelColor=070606&logo=opensourceinitiative&logoColor=ff5a19)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-1e1e1f?labelColor=070606&logo=next.js&logoColor=ff5a19)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-1e1e1f?labelColor=070606&logo=typescript&logoColor=ff5a19)](https://www.typescriptlang.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-1e1e1f?labelColor=070606&logo=github&logoColor=ff5a19)](#contributing)

<!-- Add a screenshot or GIF here — e.g. ![orqly](docs/demo.gif) -->

</div>

---

Think Postman meets a flow builder: `Create Customer → Share KYC → Create Payout` becomes three wired nodes, and `Create Payout` reads `{{nodes.Create Customer.response.body.id}}` straight from the earlier call.

## Features

- **Visual flow builder** — each node is one API request (method, URL, headers, body). Drag to connect any node to any other; the target becomes a child, one level down. Run the whole flow or a single node.
- **Response chaining** — `{{env.API_KEY}}` and `{{nodes.<name>.response.body.…}}` templates in URLs, headers and bodies, with a variable picker fed by real responses.
- **Import anything** — paste a **cURL** command, or drop an **OpenAPI 3**, **Swagger 2** or **Postman** collection; every endpoint becomes a node. An arrange step lets you set each request's level and drop the ones you don't want before building.
- **Workflow-wide env & headers** — pick one active environment and one header set from the top bar; both apply to every node. Inline node headers override the set.
- **Pre-request scripts** — a Postman-style script (with `pm` + `CryptoJS`) runs before each request; toggle it per workflow.
- **JSON body editor** — syntax-highlighted, with `{{template}}` awareness.
- **Server-side proxy** — requests execute from the server, so browser CORS never gets in the way.
- **Accounts & persistence** — email/password (+ optional Google / GitHub) via Better Auth; everything saves per user in Postgres.
- **Export / import** — share a workflow with its referenced bodies and header sets as JSON.

## Quick start

```sh
cp .env.example .env      # fill in the required keys (see below)
npm install
npx drizzle-kit push      # create the database tables
npm run dev               # http://localhost:3000
```

Sign up, and a demo workflow targeting the built-in `/api/echo` endpoint is seeded on first sign-in.

## How it works

- **Nodes & levels** — a node's *level* is its row on the canvas. Level 1 runs after Start; level 2 after level 1, and so on. Connecting or dragging a node re-derives its level and re-lays out the graph.
- **Templating** — `{{env.KEY}}` pulls from the active environment; `{{nodes.<label>.response.body.path.to.value}}` pulls from an upstream node's last response. Resolved at run time.
- **Resources** — request bodies, header sets and environments are saved once and referenced across nodes and workflows.
- **Execution** — the runner topologically walks the graph, runs each node through `/api/execute` (the server proxy), and feeds responses back into the template context for downstream nodes.

## Environment variables

All variables live in `.env` (never commit it — only `.env.example` is tracked). The optional **GitHub sign-in** and **Resend email OTP** keys are documented inline in `.env.example`.

### `DATABASE_URL` — required

Postgres connection string in the form `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`. Get one from any of:

- **Local Docker** (quickest for development):

  ```sh
  docker run -d --name orqly-pg \
    -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=orqly \
    -p 5432:5432 postgres:16
  ```

  then use `postgresql://postgres:pg@localhost:5432/orqly`.
- **Locally installed Postgres** — create a database (`createdb orqly`) and use your local credentials.
- **Hosted Postgres** — create a free project on [Neon](https://neon.tech), [Supabase](https://supabase.com) or [Railway](https://railway.app); each shows a ready-made `postgresql://…` URL. If the provider requires TLS, append `?sslmode=require`.

After setting it, run `npx drizzle-kit push` once to create the tables.

### `BETTER_AUTH_SECRET` — required

Random secret used to sign sessions. Generate it yourself:

```sh
npx @better-auth/cli@latest secret   # or: openssl rand -hex 32
```

Use a different secret per environment; rotating it signs every user out.

### `BETTER_AUTH_URL` — required

The URL the app is served from, no trailing slash. Local: `http://localhost:3000`. Production: your deployed origin.

### `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional

Enables "Continue with Google" (hidden while unset; email/password works without them). From the Google Cloud Console:

1. Create/select a project at [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → OAuth consent screen**: *External*, add yourself as a test user.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized origin: `http://localhost:3000` (+ your production origin)
   - Redirect URI: `http://localhost:3000/api/auth/callback/google` (+ production)
4. Copy the Client ID and secret into `.env`, then restart the dev server.

### `EXECUTE_BLOCK_PRIVATE_IPS` — optional, recommended in production

Set to `1` to make the request proxy (`/api/execute`) refuse URLs pointing at loopback/private addresses (`localhost`, `10.x`, `192.168.x`, …), so users can't probe your internal network. Leave unset in local dev — the seeded demo calls the app's own `/api/echo`, which a private-IP block would reject.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Flow (`@xyflow/react`) · zustand · Better Auth · Drizzle ORM · Postgres

## Project layout

```
src/
  app/            Next.js routes — pages, auth, /api/execute proxy, /api/data CRUD
  components/     canvas (React Flow nodes), sidebar, inspector, wizard, shared UI
  lib/            store (zustand), runner, interpolation, importers (curl/openapi/postman)
  db/             Drizzle schema
```

## Contributing

Issues and PRs welcome.

```sh
npm run lint          # eslint
npx tsc --noEmit      # type-check
```

Keep changes minimal and typed; `npx drizzle-kit push` after any schema change. Open an issue first for larger features.

## License

[MIT](LICENSE) © Chakravarti Avinit
