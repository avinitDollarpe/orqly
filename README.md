# orqly

Build, test and simulate complex API workflows with a node-based visual editor.

Chain API calls (Create Customer → Share KYC → Create Payout) as connected nodes, reference any
previous node's response in a later request with `{{nodes.Create Customer.response.body.id}}`,
and watch the flow execute node by node.

## Features

- **Visual flow builder** — each node is one API request (method, URL, headers, body); connect
  nodes to define execution order, run the whole flow or a single node
- **Response chaining** — `{{env.API_KEY}}` and `{{nodes.<name>.response.body.…}}` templates in
  URLs, headers and bodies, with a variable picker fed by real responses
- **Reusable resources** — saved request bodies, header sets and environments, shared across nodes
- **Accounts** — email/password (+ optional Google) sign-in via Better Auth; everything persists
  per user in Postgres
- **Server-side proxy** — requests execute from the server, so browser CORS never gets in the way
- **Export / import** — share a workflow (with its referenced bodies and header sets) as JSON

## Getting started

1. Start Postgres and create a database, e.g.
   `docker run -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=orqly -p 5432:5432 postgres:16`
2. `cp .env.example .env` and fill in `DATABASE_URL` and `BETTER_AUTH_SECRET`
   (generate one with `npx @better-auth/cli secret`). Add Google OAuth credentials
   to enable the "Continue with Google" button.
3. Install and migrate:

   ```sh
   npm install
   npx drizzle-kit push
   ```

4. `npm run dev` and sign up at [http://localhost:3000](http://localhost:3000).
   A demo workflow targeting the built-in `/api/echo` endpoint is seeded on first sign-in.

In production, set `EXECUTE_BLOCK_PRIVATE_IPS=1` so the request proxy refuses to call
loopback/private addresses.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Flow (`@xyflow/react`) · zustand ·
Better Auth · Drizzle ORM · Postgres
