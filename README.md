# EA Gathering App

Evangelical Alliance Gathering Church Action. This repository is an npm
workspaces monorepo:

- `frontend/` — Next.js App Router application and generated API types.
- `backend/openapi.yaml` — placeholder for the backend's OpenAPI contract.
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

When the backend OpenAPI specification is received, replace the starter
contract at `backend/openapi.yaml` with that spec, then run:

```sh
npm run api:types
```

This runs `openapi-typescript` and writes `frontend/lib/api/schema.d.ts`. Commit
the generated file with the updated contract; do not hand-edit generated types.
The current placeholder intentionally defines no API endpoints.

## Deploying the frontend to Vercel

Create a Vercel project from this repository and set **Root Directory** to
`frontend/`. Use the Next.js framework defaults and set the Vercel **Node.js
Version** to 22.x (22.13 or newer). The OpenAPI contract and generated types are
checked into the repository, so Vercel can build the frontend without access to
a running backend. Configure a backend URL in Vercel only after the API host
and frontend integration are defined.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js frontend |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Lint the frontend |
| `npm run typecheck` | Check frontend TypeScript |
| `npm run api:types` | Generate frontend types from `backend/openapi.yaml` |
