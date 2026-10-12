# EA Gathering App

Evangelical Alliance Gathering Church Action. This repository is an npm
workspaces monorepo:

- `frontend/` — Next.js App Router application and generated API types.
- `backend/` — FastAPI service backed by Supabase Postgres; `backend/openapi.yaml`
  is its exported OpenAPI contract.
- [`USER_STORIES.md`](./USER_STORIES.md) — Product objectives, user personas, MVP acceptance criteria, and demo flow.
- [Infrastructure runbook](#infrastructure-initialization-and-manual-steps) — Fresh-environment setup, first deployment, verification, and ongoing operations.

## Prerequisites

- Node.js 22.13 or newer and npm.
- Python 3.10 or newer for the FastAPI service and data import scripts.
- `psql` (PostgreSQL client) for initializing Supabase.

## Build and run locally

Run these commands from the repository root. `npm ci` installs the locked
workspace dependencies; the build script builds the Next.js frontend.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The frontend runs at <http://localhost:3000>. The FastAPI service must also be
running for API-backed pages. Create `backend/.env` (gitignored) with a
Supabase pooler connection string and an admin token:

```dotenv
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres?sslmode=require
ADMIN_TOKEN=<long-random-secret>
```

Use the connection string shown in the Supabase dashboard for the project and
region; do not copy the example host literally. Use the pooler rather than
`db.<project-ref>.supabase.co`. Use the transaction pooler (port `6543`) for
Vercel. Never expose `DATABASE_URL` or `ADMIN_TOKEN` to the browser or commit
them to the repository.

Create a Python virtual environment and install the API requirements:

```powershell
# Windows PowerShell
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload --port 8000
```

```sh
# macOS, Linux, Git Bash, or WSL
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
backend/.venv/bin/python -m uvicorn main:app --app-dir backend --reload --port 8000
```

Run the backend command in one terminal and `npm run dev` in another. Next.js
proxies `/openapi/...` to `http://127.0.0.1:8000`; set `BACKEND_URL` if the API
is listening elsewhere. The interactive API docs are at
<http://localhost:3000/openapi/docs>; the schema is at
<http://localhost:3000/openapi/openapi.json>.

Backend tests:

```powershell
backend\.venv\Scripts\python.exe -m unittest discover -s backend
```

## Initialize and seed Supabase

The backend connects directly to Supabase Postgres. The checked-in seed tools
are SQL generators, not automatic migrations: they read
`data-source/combined.db` and `data-source/MP Contact List.csv`, write SQL to
standard output, and `psql` executes that SQL against the database selected by
`DATABASE_URL`.

Run the following from the repository root in Bash (macOS/Linux/Git Bash/WSL)
after installing the Python requirements and PostgreSQL client. The first
command prompts for the intended Supabase **transaction pooler** connection
string without echoing it or putting it in shell history:

```sh
read -s -p 'Supabase DATABASE_URL: ' DATABASE_URL; printf '\n'; export DATABASE_URL

# 1. Core directory, service, and postcode tables/data, plus indexes, views,
#    trigger function, and row-level security.
python3 backend/scripts/import_combined_db.py > /tmp/ea-combined.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f /tmp/ea-combined.sql

# 2. MP records. This joins each MP to a constituency code from postcodes.
python3 backend/scripts/import_mps.py > /tmp/ea-mps.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f /tmp/ea-mps.sql

# 3. Church submission table, after the core import creates set_updated_at().
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/scripts/church_submissions.sql

rm /tmp/ea-combined.sql /tmp/ea-mps.sql
```

This is an initial bootstrap sequence for a fresh database. The import scripts
fail if their tables already exist. Do not add `--replace` to a production
command: it drops and recreates the corresponding tables (and the combined
import replaces its views and function), destroying edits and submission data.
The submission SQL is also a one-time schema setup, not an idempotent migration.
Take a database backup before any intentional reseed. These scripts do not
update existing rows or transfer data automatically after the initial import.

Check the import before deploying:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "select 'churches' as table_name, count(*) from churches
   union all select 'services', count(*) from services
   union all select 'postcodes', count(*) from postcodes
   union all select 'mps', count(*) from mps;"
```

After seeding, `GET /openapi/churches?limit=1`, `GET /openapi/areas`, and
`GET /openapi/mp/lookup?postcode=DN1%203LN` exercise the database-backed API.
`church_submissions` starts empty and is populated through the submission
form; the admin API requires `Authorization: Bearer <ADMIN_TOKEN>`.

## OpenAPI types

After changing FastAPI routes or models, regenerate the contract and frontend
types from the repository root. Install PyYAML in the backend virtual
environment if it is not already present:

```powershell
# Windows PowerShell
backend\.venv\Scripts\python.exe -m pip install PyYAML
backend\.venv\Scripts\python.exe backend\scripts\export_openapi.py
npm run api:types
```

```sh
# macOS, Linux, Git Bash, or WSL
backend/.venv/bin/python -m pip install PyYAML
backend/.venv/bin/python backend/scripts/export_openapi.py
npm run api:types
```

This updates `backend/openapi.yaml` and `frontend/lib/api/schema.d.ts`. Commit
both generated files; do not hand-edit the TypeScript schema.

## Deploy to Vercel

The root [`vercel.json`](./vercel.json) configures two Vercel Services in one
project: Next.js uses `frontend/`, and FastAPI uses `backend/` with
`main:app` as its entry point. Requests to `/openapi/...` are routed to the
FastAPI service with the prefix preserved; other requests go to Next.js. This
includes `/api/parish-dashboards`, which is a Next.js route, not a FastAPI
endpoint. The FastAPI docs and schema are `/openapi/docs` and
`/openapi/openapi.json`; there is no `/openapi` health endpoint.

Follow the step-by-step [infrastructure initialization and manual steps](#infrastructure-initialization-and-manual-steps) below for a new environment.

The runtime architecture, endpoint list, and database tables are documented in
[`backend/endpoints.md`](./backend/endpoints.md).

Church directory records and initiatives are loaded at runtime from the API.
Some richer church-profile copy (such as authored stories and impact
talking-points) is still maintained as frontend content, with generated
fallbacks where no authored profile exists; it is not part of the Supabase
seed.

## Infrastructure initialization and manual steps

This is the from-zero checklist for an operator with access to the organization
accounts for Supabase, Vercel, Google Cloud (if maps are wanted), and the DNS
provider (if using a custom domain). Account creation, billing approval,
project linking, secret entry, DNS changes, database backups, and production
approval are manual platform actions; this repository does not automate them.
There is no checked-in infrastructure-as-code, CI workflow, repeatable
migration runner, or automatic database seeding. Do not treat a successful
Vercel build as proof that Supabase has been initialized.

### 1. Prepare and validate the repository

1. Confirm the intended production branch (the current README assumes `main`)
   and that `data-source/combined.db` and
   `data-source/MP Contact List.csv` are present in the checked-out revision.
   Keep the branch protected according to the organization’s release policy.
2. Install the supported runtimes and tools: Node.js 22.13+, npm, Python 3.10+,
   and `psql`. Install the repository dependencies, run type-check/tests, and
   make a production build:

   ```sh
   npm ci
   npm run typecheck
   npm test
   npm run build
   ```

   Frontend tests require the platform-specific optional native packages to
   have installed correctly. Resolve dependency-install problems before
   treating a test run as passed.
3. For local API development, create `backend/.env` with `DATABASE_URL` and
   `ADMIN_TOKEN` as described above, create the backend virtual environment,
   and start uvicorn and Next.js in separate terminals. No production secret
   or local environment file should be committed.

### 2. Create and seed the Supabase project

1. In Supabase, create a project in the organization that will own production.
   Choose a region close to the Vercel deployment, set a strong unique database
   password, and retain the project reference and recovery details in the
   organization’s approved secret store.
2. Wait until the database is available. In the project’s **Connect** panel,
   select the transaction pooler connection details. Use the exact host,
   username, database, password, and SSL parameters Supabase supplies; the
   pooler hostname/username format depends on the project and must not be
   guessed. Use port `6543`.
3. Before applying scripts, verify that `DATABASE_URL` points to the intended
   new project. Follow [Initialize and seed Supabase](#initialize-and-seed-supabase)
   exactly once, in order: combined database import, MP import, then church
   submissions schema. The input database is the initial seed source; no
   ongoing sync from those local files is configured.
4. Run the documented count queries and confirm that the counts are non-zero
   where expected. Also confirm the tables, reporting views, indexes, triggers,
   and RLS settings were created. If a command fails, stop and diagnose before
   retrying; these scripts are not safe to blindly rerun. Do not use
   `--replace` on a database with live data or submissions.
5. Keep database access server-side. Tables have RLS enabled and no public
   policies; the application connects through FastAPI using `DATABASE_URL`.
   Do not put the connection string, database password, or admin token into a
   `NEXT_PUBLIC_*` variable or frontend code.

### 3. Create and configure Vercel

1. Confirm that the Vercel account/team supports the Vercel Services feature
   used by the root `vercel.json`. Create a Vercel project and link it to this
   repository and production branch. If Services are unavailable for the
   account, stop: replacing this topology with separately deployed services
   requires changing and verifying the routing configuration, not just
   changing a dashboard setting.
2. In **Project Settings → Build and Deployment**, set the project Root
   Directory to the repository root (clear any `frontend` setting). The
   repository’s `vercel.json` declares the `frontend/` Next.js and `backend/`
   FastAPI service roots. Remove conflicting project-level install, build, or
   output overrides; use Node.js 22.13 or newer.
3. Add `DATABASE_URL` and a strong `ADMIN_TOKEN` to the FastAPI `openapi`
   service’s server environment variables for both Preview and Production.
   `DATABASE_URL` must be the Supabase transaction-pooler URL on port `6543`.
   Store and distribute the admin token through the team’s approved secret
   manager. Do not use a browser/public Supabase key in place of
   `DATABASE_URL`. Configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` on the
   `frontend` service for each environment where maps should work. Configure
   `NEXT_PUBLIC_SITE_URL` on `frontend` in Production for the canonical
   domain; leave it unset in Preview unless preview URLs are deliberately
   wanted as canonical sitemap URLs. Vercel injects `VERCEL_URL`; the frontend
   uses it for server-side API requests so each deployment reaches its own
   `/openapi/...` route.
4. Save the variables and trigger a new deployment after any environment
   variable change. Vercel deployments use a snapshot of variables taken at
   build/deploy time; changing the dashboard does not update already-built
   deployments.
5. Do not configure a static export or build-time page generation for live
   records. The church directory shell (`/churches`) may be statically rendered
   because its records are fetched by the browser at runtime; church detail
   pages and constituency pages fetch from the API on the server at request
   time. Those detail/index routes must not be pre-generated from a deployment-
   time data snapshot. The route table from `npm run build` may therefore show
   `/churches` as static and the detail/constituency routes as dynamic.

### 4. Configure the optional map integration

The church and constituency directories still work as text/list/card views
without Google Maps. To enable maps:

1. In Google Cloud, create/select the organization-owned project, enable
   billing if required, and enable the Maps JavaScript API.
2. Create a browser API key restricted to the Maps JavaScript API and HTTP
   referrers. Allow only the production/custom domain and the Vercel Preview
   host patterns needed by the team; avoid an unrestricted key.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel for Preview and Production.
   This is a browser-visible, referrer-restricted key, not a secret. Redeploy
   both environments after setting it. For local development, put it in
   `frontend/.env.local`; never commit that file.
4. Verify map load, pins, and interaction on an allowed origin. If this
   integration is not provisioned, verify the cards/list fallback and record
   that maps are intentionally disabled.

### 5. Attach the production domain and canonical URL

1. Add the agreed domain in Vercel **Settings → Domains** and perform the
   requested DNS changes at the domain’s DNS provider. Follow the exact
   records and verification status shown by Vercel; do not guess A/CNAME
   values. Confirm TLS is issued and the domain serves the production
   deployment.
2. Add `NEXT_PUBLIC_SITE_URL` to the Production environment of the `frontend`
   service using the canonical HTTPS origin only (for example,
   `https://www.example.org`, with no path or trailing slash). This sets
   absolute sitemap and robots URLs. Vercel’s production URL is the fallback
   when this variable is unset. Redeploy after setting/changing it.
3. If the organization wants `www` and apex to redirect to one canonical
   hostname, configure the primary/redirect domain in Vercel and verify both
   URLs. Configure any external analytics/search-console properties
   separately; none are provisioned by this repository.

### 6. Deploy and perform the release checks

1. Push a pull request and wait for its Vercel Preview. Check the build logs
   for both services and resolve failures. Verify the Preview uses the
   intended database and admin token; do not assume it is isolated from
   Production if the same Supabase `DATABASE_URL` is configured in both.
2. On the Preview URL, check `/`, `/api/parish-dashboards`,
   `/openapi/docs`, `/openapi/openapi.json`, `/openapi/churches?limit=1`, and
   `/openapi/areas`. Exercise `/churches`, `/constituencies`, a church detail
   page, and a constituency detail page. Confirm the data is live, maps work
   if enabled, and there are no server logs for database, connection, or
   routing errors.
3. Test the submission flow with synthetic test details if permitted; verify
   the record appears in `/admin` using the admin token, then mark it rejected
   in the admin screen. If deletion is required, arrange it through the
   approved database maintenance process (there is no delete endpoint).
   Do not enter real personal data for testing or leave test data in the live
   system.
4. Merge to the production branch only after review/approval. Wait for the
   Production deployment to complete; verify the same endpoints and user
   journeys on the canonical production domain. Confirm `/sitemap.xml` and
   `/robots.txt` use the canonical HTTPS origin.
5. Confirm the final Preview and Production deployment IDs and URLs, database
   project reference, domain, and verification status are recorded in the
   organization’s deployment record (never record secret values there).

### 7. Ongoing operations and manual maintenance

- **Application releases:** pull requests produce Preview deployments and
  merges to the configured production branch deploy through Vercel’s Git
  integration. No GitHub Actions workflow is configured in this repository.
- **Database changes:** there is no migration framework. Review schema changes
  and update a deliberate SQL migration/runbook before applying them. Take and
  verify a Supabase backup before production changes. The initial seed scripts
  are for empty-database bootstrap only, not routine refreshes.
- **Seed refreshes:** new source data is not automatically imported. Plan,
  review, and run a separately approved import/update process; do not use
  `--replace` to refresh production, since that drops directory tables.
- **Secrets and access:** rotate database credentials and `ADMIN_TOKEN`
  through Supabase/Vercel and the approved secret manager, then redeploy.
  Remove access for departing maintainers. Keep the admin page token private.
- **Google Maps and domains:** review API-key referrer restrictions, billing,
  DNS ownership, TLS, and canonical sitemap URLs when domains or teams change.
- **Health and backup checks:** monitor Vercel service/function logs and
  Supabase database health/backup status. The public `/openapi` prefix has no
  root health endpoint; use `/openapi/docs` or a database-backed endpoint for
  a smoke check. Establish backup retention and restore testing with the
  organization’s Supabase plan/process.
- **Operations ownership:** assign named owners for Vercel, Supabase, DNS,
  Google Cloud (if used), secret rotation, deployment approvals, and incident
  response. Configure billing notifications/usage alerts where those
  providers and plans support them; this repository does not create alerts.

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
| `npm test` | Run frontend tests |
| `npm run api:types` | Generate frontend types from `backend/openapi.yaml` |
