# FastAPI Endpoints — EA Gathering App

The frontend currently renders from three sources:

- **Hardcoded sample data** — `app/churches/ChurchFinder.tsx`, the retired `app/your-area/area-data.ts`
- **localStorage** — `lib/churchStore.ts`, the contact-MP draft
- **One Next.js route** — `app/api/parish-dashboards/route.ts`

The endpoints below replace those sources. Status legend: **✅ implemented**,
**⚠️ partial**, **❌ not implemented**.

## Church directory — `/churches` (PUB-01)

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 1 | `GET` | `/churches` | ⚠️ partial | List/search churches (replaces hardcoded `churches` array) | `q`, `letter`, `initiatives` (CSV), `days` (CSV), `lat`, `lng`, `radius` | `Church[]` |
| 2 | `GET` | `/churches/{id}` | ❌ | Single church profile card | — | `Church` |
| 3 | `GET` | `/initiatives` | ❌ | Initiative taxonomy (replaces `lib/initiatives.ts`) | — | `Initiative[]` |
| 4 | `GET` | `/geocode` | ❌ | Resolve postcode/place → lat/lng (replaces local `resolveCenter`) | `q` | `{ lat, lng }` |

`Church` = `{ id, name, address, place, lat, lng, denomination, operatingHours, verified, initiatives[], contactFirstName, contactSurname, contactRole, contactEmail }`

> **Status note:** `GET /churches` and `POST /churches` are implemented in
> `backend/main.py` but are **in-memory** (a Python list), not backed by
> `data-source/combined.db`. They are also unreachable in production (see the
> routing note). `GET /churches/{id}`, `/initiatives`, and `/geocode` are not
> implemented.

## Demand side — `/demand`

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 5 | `GET` | `/parish-dashboards` | ❌ | Diocese list + parish dashboard search (replaces Next.js `/api/parish-dashboards`) | `diocese`, `search` | `{ dioceses: Diocese[], results: ParishDashboard[] }` |

`Diocese` = `{ id, name }` · `ParishDashboard` = `{ diocese, deanery, parish, parishCode, pdfUrl }`

## Contact MP — `/contact-mp`

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 6 | `GET` | `/mp/lookup` | ❌ | Postcode → MP details (replaces demo `demoMp` for `DN1 3LN`) | `postcode` | `MP` |
| 7 | `POST` | `/letters` | ❌ | Submit letter / advocacy-follow-up + monthly-update preferences (currently browser-only) | body | `Letter` |

`MP` = `{ name, party, email, constituency }`

## Submit a church — `/submit`

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 8 | `POST` | `/churches` | ⚠️ partial | Submit a church for review (replaces `submitChurch` in `churchStore`) | body | `ChurchSubmission` |

> **Status note:** `POST /churches` is implemented in `backend/main.py` but is
> **in-memory** and not wired to the frontend — the submit form still writes to
> localStorage via `lib/churchStore.ts`.

## Your constituency — `/constituencies`

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 9 | `GET` | `/areas` | ❌ | Constituency summary by postcode (replaces `sampleAreas`) | `postcode` | `Area` |
| 10 | `GET` | `/areas/{constituency}` | ❌ | Specific constituency | — | `Area` |

`Area` = `{ constituency, postcode, mpName, mpEmail, churches: AreaChurch[] }` · `AreaChurch` = `{ id, name, postcode, denomination, attendance, projects: { activityId, reach, frequency }[] }`

## Admin review — `/admin`

| # | Method | Path | Status | Purpose | Key request params | Response shape |
|---|--------|------|--------|---------|-------------------|----------------|
| 11 | `GET` | `/admin/submissions` | ❌ | List pending submissions (replaces `getPendingSubmissions`) | — | `ChurchSubmission[]` |
| 12 | `PATCH` | `/admin/submissions/{id}` | ❌ | Approve/reject or update initiatives (replaces `approveChurch`/`rejectChurch`/`updateSubmissionInitiatives`) | body | `ChurchSubmission` |

`ChurchSubmission` = `{ id, name, denomination, address, place, postcode, operatingHours, contactName, contactEmail, initiatives[], status, submittedAt }`

## Data source notes

- `data-source/combined.db` holds the real data: `postcodes` (postcode → lat/lng + constituency), `churches`, `services` (with `category_id`), `categories`, and `church_services`. Endpoints 1–4 and 9–10 map directly onto these tables.
- MP lookup (6): `postcodes.constituency` gives the constituency; MP name/party/email come from `data-source/MP Contact List.csv` (columns `FullName`, `Party`, `Constituency`, `ParliamentEmail`).
- Initiative taxonomy (3): the frontend uses three overlapping taxonomies (`lib/initiatives.ts`, `lib/messaging/draft.ts`, `area-data.ts` `activityCatalog`). The backend should serve one canonical list; the `categories` table is the closest existing source.
- Letter generation (7): the letter body is currently built client-side with Mustache templates (`lib/messaging`). If moved server-side, `POST /letters` accepts the `LetterInput` shape and returns the rendered letter; otherwise it only needs to persist the follow-up preferences.
- Geocoding (4): the church directory's `resolveCenter` handles full postcode, postcode area, and place name — the backend can use the `postcodes`/`outcodes` tables.
