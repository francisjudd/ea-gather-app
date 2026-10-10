# FastAPI Endpoints — EA Gathering App

Endpoints required to render the frontend as it stands. All paths are served
under the `/openapi` prefix (per `vercel.json` + `main.py`), so a route defined
as `/churches` is reached at `/openapi/churches`. The service strips the public
prefix before forwarding; FastAPI routes are unprefixed and root_path is `/openapi`.

The frontend currently renders from three sources:

- **Hardcoded sample data** — `app/churches/ChurchFinder.tsx`, `app/your-area/area-data.ts`
- **localStorage** — `lib/churchStore.ts`, the contact-MP draft
- **One Next.js route** — `app/api/parish-dashboards/route.ts`

The endpoints below replace those sources.

## Church directory — `/churches` (PUB-01)

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 1 | `GET` | `/openapi/churches` | List/search churches (replaces hardcoded `churches` array) | `q`, `letter`, `initiatives` (CSV), `days` (CSV), `lat`, `lng`, `radius` | `Church[]` |
| 2 | `GET` | `/openapi/churches/{id}` | Single church profile card | — | `Church` |
| 3 | `GET` | `/openapi/initiatives` | Initiative taxonomy (replaces `lib/initiatives.ts`) | — | `Initiative[]` |
| 4 | `GET` | `/openapi/geocode` | Resolve postcode/place → lat/lng (replaces local `resolveCenter`) | `q` | `{ lat, lng }` |

`Church` = `{ id, name, address, place, lat, lng, denomination, operatingHours, verified, initiatives[] }`

## Demand side — `/demand`

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 5 | `GET` | `/openapi/parish-dashboards` | Diocese list + parish dashboard search (replaces Next.js `/api/parish-dashboards`) | `diocese`, `search` | `{ dioceses: Diocese[], results: ParishDashboard[] }` |

`Diocese` = `{ id, name }` · `ParishDashboard` = `{ diocese, deanery, parish, parishCode, pdfUrl }`

## Contact MP — `/contact-mp`

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 6 | `GET` | `/openapi/mp/lookup` | Postcode → MP details (replaces demo `demoMp` for `DN1 3LN`) | `postcode` | `MP` |
| 7 | `POST` | `/openapi/letters` | Submit letter / advocacy-follow-up + monthly-update preferences (currently browser-only) | body | `Letter` |

`MP` = `{ name, party, email, constituency }`

## Submit a church — `/submit`

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 8 | `POST` | `/openapi/churches` | Submit a church for review (replaces `submitChurch` in `churchStore`) | body | `ChurchSubmission` |

## Your area — `/your-area`

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 9 | `GET` | `/openapi/areas` | Constituency summary by postcode (replaces `sampleAreas`) | `postcode` | `Area` |
| 10 | `GET` | `/openapi/areas/{constituency}` | Specific constituency | — | `Area` |

`Area` = `{ constituency, postcode, mpName, mpEmail, churches: AreaChurch[] }` · `AreaChurch` = `{ id, name, postcode, denomination, attendance, projects: { activityId, reach, frequency }[] }`

## Admin review — `/admin`

| # | Method | Path | Purpose | Key request params | Response shape |
|---|--------|------|---------|-------------------|----------------|
| 11 | `GET` | `/openapi/admin/submissions` | List pending submissions (replaces `getPendingSubmissions`) | — | `ChurchSubmission[]` |
| 12 | `PATCH` | `/openapi/admin/submissions/{id}` | Approve/reject or update initiatives (replaces `approveChurch`/`rejectChurch`/`updateSubmissionInitiatives`) | body | `ChurchSubmission` |

`ChurchSubmission` = `{ id, name, denomination, address, place, postcode, operatingHours, contactName, contactEmail, initiatives[], status, submittedAt }`

## Data source notes

- `data-source/combined.db` holds the real data: `postcodes` (postcode → lat/lng + constituency), `churches`, `services` (with `category_id`), `categories`, and `church_services`. Endpoints 1–4 and 9–10 map directly onto these tables.
- MP lookup (6): `postcodes.constituency` gives the constituency; MP name/party/email come from `data-source/MP Contact List.csv` (columns `FullName`, `Party`, `Constituency`, `ParliamentEmail`).
- Initiative taxonomy (3): the frontend uses three overlapping taxonomies (`lib/initiatives.ts`, `lib/messaging/draft.ts`, `area-data.ts` `activityCatalog`). The backend should serve one canonical list; the `categories` table is the closest existing source.
- Letter generation (7): the letter body is currently built client-side with Mustache templates (`lib/messaging`). If moved server-side, `POST /letters` accepts the `LetterInput` shape and returns the rendered letter; otherwise it only needs to persist the follow-up preferences.
- Geocoding (4): the church directory's `resolveCenter` handles full postcode, postcode area, and place name — the backend can use the `postcodes`/`outcodes` tables.
