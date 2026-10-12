# Backend API and database

The production application uses a Next.js frontend and a FastAPI service,
deployed as separate Vercel Services in the same Vercel project. The API
connects to Supabase Postgres with the server-side `DATABASE_URL`. The
frontend calls the API at same-origin `/openapi/...` URLs; Vercel routes those
requests to FastAPI without removing the `/openapi` prefix. In local
development, `next.config.ts` proxies the same paths to uvicorn.

The live OpenAPI contract is served at `/openapi/openapi.json`; interactive
documentation is at `/openapi/docs`. There is no public `/openapi` health
route. The FastAPI app root (`/`) is a service-local health response, while
the public root URL (`/`) is served by the frontend.

## Implemented API routes

All paths below include the `/openapi` prefix used by the public API.

| Method | Path | Purpose | Parameters / authentication |
| --- | --- | --- | --- |
| `GET` | `/openapi/churches` | Search/list churches from Supabase | Optional `q`, `letter`, comma-separated `initiatives`, `lat`, `lng`, `radius` (default 15 miles), and `limit` (default 5000; maximum 5000). `lat` and `lng` must be supplied together. |
| `GET` | `/openapi/churches/{church_id}` | Get a church by its slug | `church_id` path parameter |
| `POST` | `/openapi/churches` | Submit a church for admin review | JSON submission body; stored in `church_submissions` |
| `GET` | `/openapi/initiatives` | List initiative categories | Reads category names from Supabase |
| `GET` | `/openapi/geocode` | Resolve a full postcode, outcode, or place | Required `q`; checks Supabase and may fall back to postcodes.io |
| `GET` | `/openapi/mp/lookup` | Resolve a UK postcode to its MP | Required `postcode`; uses postcode and MP tables, with postcodes.io fallback |
| `GET` | `/openapi/areas` | List constituencies and church/service counts | Reads Supabase |
| `GET` | `/openapi/areas/details` | Return every constituency with full details | Reads Supabase; must be matched before `/openapi/areas/{slug}` |
| `GET` | `/openapi/areas/{slug}` | Get one constituency and its church/service details | `slug` path parameter |
| `GET` | `/openapi/admin/submissions` | List submissions by status | Optional `status` (`pending`, `approved`, or `rejected`); Bearer admin token required |
| `PATCH` | `/openapi/admin/submissions/{submission_id}` | Update submission status and/or initiatives | JSON patch body; Bearer admin token required |

Admin requests must send `Authorization: Bearer <ADMIN_TOKEN>`. If
`ADMIN_TOKEN` is not configured, the admin endpoints return `503`; an absent
or incorrect token returns `401`.

The parish-dashboard search is not a FastAPI endpoint. It remains a Next.js
route at `/api/parish-dashboards`, which fetches the Church of England
dashboard site and returns the parsed results.

## Supabase schema and initial data

The database bootstrap scripts are under `backend/scripts/`:

- `import_combined_db.py` converts `data-source/combined.db` into SQL for
  `postcodes`, `outcodes`, `categories`, `services`, `churches`, and
  `church_services`; it also creates indexes, timestamp triggers, reporting
  views, and enables row-level security.
- `import_mps.py` converts `data-source/MP Contact List.csv` into the `mps`
  table and associates constituency codes from `postcodes`.
- `church_submissions.sql` creates the submission-review table and its
  timestamp trigger. Run it after `import_combined_db.py`, which creates the
  `set_updated_at()` trigger function.

These are one-time initial bootstrap tools, not repeatable migrations. They
emit SQL to standard output and are run with `psql`; consult the root
[`README.md`](../README.md#initialize-and-seed-supabase) for the ordered
commands and the destructive effect of the `--replace` option. Do not expose
the database connection string to the browser. Supabase row-level security is
enabled without public policies; API access is through the trusted server-side
Postgres connection.

`church_submissions` starts empty. Public submissions are written there by
`POST /openapi/churches`; the admin endpoints review and update those records.

The directory's church records and initiative categories come from Supabase.
Some richer church-profile content (authored stories and impact talking-points)
is still maintained in the frontend and has generated fallbacks; it is not
populated by these seed scripts.
