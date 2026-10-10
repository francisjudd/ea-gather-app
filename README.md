# EA Gathering App

Evangelical Alliance Gathering Church Action. This repository is an npm
workspaces monorepo:

- `frontend/` — Next.js App Router application and generated API types.
- `backend/` — FastAPI service serving the live OpenAPI contract at `/openapi/openapi.json`.
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

## Generate backend types

The backend serves its OpenAPI contract at `/openapi/openapi.json`. Regenerate
the frontend types from the live contract:

```sh
npm run api:types
```

This runs `openapi-typescript` against the deployed contract and writes
`frontend/lib/api/schema.d.ts`. Commit the generated file with the updated
contract; do not hand-edit generated types.

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
the public request path rather than stripping the prefix. The backend currently
defines its routes at `/churches` (not `/openapi/churches`), so the live
`/churches` endpoint is only reachable through the backend directly — see
[`backend/endpoints.md`](./backend/endpoints.md) for the documented contract and
the routing note.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js frontend |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Lint the frontend |
| `npm run typecheck` | Check frontend TypeScript |
| `npm run api:types` | Generate frontend types from the live backend contract |
