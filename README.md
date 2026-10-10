# EA Gathering App

Evangelical Alliance Gathering Church Action. This repository is an npm
workspaces monorepo:

- `frontend/` — Next.js App Router application and generated API types.
- `backend/` — FastAPI service backed by Supabase Postgres; `backend/openapi.yaml`
  is its exported OpenAPI contract.
- [`USER_STORIES.md`](./USER_STORIES.md) — Product objectives, user personas, MVP acceptance criteria, and demo flow.

## Prerequisites

- Node.js 22.13 or newer and npm

## Getting started

Install dependencies from the repository root, then start the frontend:

```sh
npm install
npm run dev
```

The app runs at <http://localhost:3000>.

## Backend (FastAPI + Supabase)

The API reads from a Supabase Postgres database. Create `backend/.env`
(gitignored) with:

```sh
# Supabase session/transaction pooler (IPv4). The direct db.<ref>.supabase.co
# host is IPv6-only and won't connect from most networks.
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
# Shared secret for /openapi/admin/* (send as `Authorization: Bearer <token>`)
ADMIN_TOKEN=<long random string>
```

Run it alongside the frontend:

```sh
cd backend
python3 -m venv venv && venv/bin/pip install -r requirements.txt
venv/bin/uvicorn main:app --reload --port 8000
```

`npm run dev` proxies `/openapi/*` to `http://127.0.0.1:8000` (override with
`BACKEND_URL`), so the frontend always calls same-origin `/openapi/...` URLs.
Interactive docs: <http://localhost:3000/openapi/docs>. Tests:
`cd backend && venv/bin/python -m unittest`.

Loading data (already done for the shared Supabase project):
`backend/scripts/import_combined_db.py` (churches, services, postcodes from
`data-source/combined.db`), `backend/scripts/import_mps.py` (MPs from the CSV)
and `backend/scripts/church_submissions.sql`. See each file for usage.

## Generate backend types

After changing the API, export its contract and regenerate the frontend types:

```sh
backend/venv/bin/pip install pyyaml
backend/venv/bin/python backend/scripts/export_openapi.py
npm run api:types
```

This writes `backend/openapi.yaml` and `frontend/lib/api/schema.d.ts`. Commit
both; do not hand-edit generated types.

## Deploying Next.js and FastAPI to Vercel

The root `vercel.json` uses Vercel Services (Beta) to deploy both applications
in one project, under the project's existing domain:

- `/openapi` and `/openapi/*` route to FastAPI in `backend/`.
- All other paths route to Next.js in `frontend/`, including the existing
  `/api/parish-dashboards` endpoint.
- FastAPI's health response is at `/openapi`, interactive docs at
  `/openapi/docs`, and OpenAPI schema at `/openapi/openapi.json`.

Before merging this configuration, open the existing Vercel project's
**Settings → Build and Deployment**, change **Root Directory** from `frontend`
to the repository root (leave the field empty), and save. Keep the existing
Node.js version and framework defaults; remove any custom project-level build,
install, or output overrides if present so each service uses its own defaults.
No domain or DNS changes are needed.

After the PR preview deploys, verify `/`, `/api/parish-dashboards`, `/openapi`,
and `/openapi/docs` on its preview URL before merging. Merging to `main` then
uses the project's normal production deployment workflow.

For local development of both services, install the Python requirements and
run the Vercel CLI from the repository root:

```sh
python -m pip install -r backend/requirements.txt
npx vercel dev --local
```

Add future FastAPI endpoints under `/openapi/...`: service routing preserves
the public request path rather than stripping the prefix.

Set `DATABASE_URL` and `ADMIN_TOKEN` in the Vercel project's environment
variables. On Vercel, use the transaction pooler (port `6543`) for
`DATABASE_URL`, which suits serverless functions.

## UTM tracking parameter

The email to an MP (built in `frontend/lib/messaging/`) includes a link to the
church's constituency page, for example:

```text
https://<site>/constituencies/putney?utm_campaign=mp_outreach
```

**Purpose:** to measure how effective these emails are. Visits to a
constituency page with `utm_campaign=mp_outreach` show how many MPs' offices
(or others they forward the email to) follow the link from a letter, and which
constituencies they come from. It is the only signal we get back from an email
sent from the church's own account.

- The parameter is defined once, as `LETTER_LINK_PARAMS` in
  `frontend/lib/messaging/draft.ts`. Analytics tools that read UTM parameters
  pick up `utm_campaign` automatically. The constituency page can also read it
  to fire an event or show a banner or modal to visitors arriving from a letter.
- There is deliberately only one parameter. The link is pasted into a
  plain-text email, so it should stay short and contain no `&`.
- Do not change the value once letters are being sent: analytics would treat it
  as a different campaign.
- Never put personal details (names, emails, postcodes) in the link. If letters
  ever need telling apart, use a random opaque code that the backend records.
- The site address in the link is the browser's origin, so only letters created
  on the production site carry the production address.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js frontend |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Lint the frontend |
| `npm run typecheck` | Check frontend TypeScript |
| `npm run api:types` | Generate frontend types from `backend/openapi.yaml` |
