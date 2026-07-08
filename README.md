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

1. Create `.env` and fill in every key — see
   [Environment variables](#environment-variables) below for where each one comes from:

   ```sh
   cp .env.example .env
   ```

2. Install and create the database tables:

   ```sh
   npm install
   npx drizzle-kit push
   ```

3. `npm run dev` and sign up at [http://localhost:3000](http://localhost:3000).
   A demo workflow targeting the built-in `/api/echo` endpoint is seeded on first sign-in.

## Environment variables

All variables live in `.env` (never commit it — only `.env.example` is tracked).

### `DATABASE_URL` — required

Postgres connection string in the form
`postgresql://USER:PASSWORD@HOST:PORT/DATABASE`. Get one from any of:

- **Local Docker** (quickest for development) — run

  ```sh
  docker run -d --name orqly-pg \
    -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=orqly \
    -p 5432:5432 postgres:16
  ```

  then use `postgresql://postgres:pg@localhost:5432/orqly`.
- **Locally installed Postgres** — create a database (`createdb orqly`) and use your
  local credentials, e.g. `postgresql://postgres:yourpassword@localhost:5432/orqly`.
- **Hosted Postgres** — create a free project on [Neon](https://neon.tech),
  [Supabase](https://supabase.com) (Project Settings → Database → Connection string),
  or [Railway](https://railway.app); each shows a ready-made `postgresql://…` URL to
  copy. If the provider requires TLS, append `?sslmode=require`.

After setting it, run `npx drizzle-kit push` once to create the tables.

### `BETTER_AUTH_SECRET` — required

Random secret used to sign sessions. You don't fetch this anywhere — generate it yourself:

```sh
npx @better-auth/cli@latest secret
# or
openssl rand -hex 32
```

Paste the output as the value. Use a different secret per environment, and rotating it
signs every user out.

### `BETTER_AUTH_URL` — required

The URL the app is served from, with no trailing slash.

- Local development: `http://localhost:3000`
- Production: your deployed origin, e.g. `https://orqly.example.com`

### `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional

Enables the "Continue with Google" button (it stays hidden while these are unset;
email/password works without them). Fetch them from the Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create
   (or select) a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app
   name and support email, and add yourself as a test user while the app is in
   testing mode.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
     (add your production origin too)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
     (and `https://<your-domain>/api/auth/callback/google` for production)
4. Click **Create** — the dialog shows the **Client ID** and **Client secret**;
   copy them into `.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

5. Restart the dev server so the new variables load.

### `EXECUTE_BLOCK_PRIVATE_IPS` — optional, recommended in production

Set to `1` to make the request proxy (`/api/execute`) refuse URLs that point at
loopback/private addresses (`localhost`, `10.x`, `192.168.x`, …), so users can't probe
your internal network. Leave it unset in local development — the seeded demo calls the
app's own `/api/echo` endpoint, which a private-IP block would reject.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Flow (`@xyflow/react`) · zustand ·
Better Auth · Drizzle ORM · Postgres
