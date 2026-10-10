# User Stories & Product Objectives

## Core Objectives

- **Primary Objective:** Build a relationship between MPs and churches by giving MPs visibility of churches’ social impact activities.
- **Why it matters:** If we can show MPs evidence of what churches are already doing, then churches can get more support from their local MP, and constituents can get signposted to the work being done.

---

## MVP Readiness Status

Status against the **Definition of Hackathon Success (MVP Deliverables)**. Legend:
✅ **working** · ⚠️ **partial** · ❌ **not implemented**.

| # | MVP Deliverable | Status | Notes |
|:---|:---|:---|:---|
| 1 | Working Map/Directory | ✅ | Searchable UI (`app/churches/ChurchFinder.tsx`) with map, filters by initiative/day. Uses **hardcoded sample data** (`church-data.ts`), not the DB. |
| 2 | End-to-End Submission Flow | ⚠️ | Form (`app/submit/SubmitChurchForm.tsx`) captures initiatives and writes to **localStorage** (`lib/churchStore.ts`), not the backend DB. Backend `POST /churches` exists but is in-memory and unwired. |
| 3 | Dynamic MP Advocate Tool | ⚠️ | 7-step flow (`app/contact-mp/ContactMpFlow.tsx`) with pre-filled, editable letter. Postcode→MP uses **hardcoded demo** (`demoMp` for `DN1 3LN`); no live lookup. |
| 4 | Documented Endpoint | ⚠️ | Backend serves OpenAPI at `/openapi/openapi.json` with `GET/POST /churches`, `PATCH /churches/{id}`. Endpoints are **in-memory**, not DB-backed, and **unreachable in production** (routing mismatch — see `backend/endpoints.md`). |
| — | Stewardship (handover-ready) | ⚠️ | README, AGENTS.md, USER_STORIES.md exist. README updated to reflect live backend. |
| — | MP 'email click tracking' | ❌ | No click tracking implemented anywhere. |

---

## 1. Church Admin (Pastor, Operations Manager, Volunteer)

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **CA-01** | `[MVP]` | **When** I hear the Evangelical Alliance is mapping church social action, **I want to** find my church already listed with what’s known about us, **so I can** confirm or correct it in a few minutes rather than start a form from scratch. | Pre-filled lookup from known data / public registry. |
| **CA-02** | `[MVP]` | **When** I enter my postcode, **I want to** see my local MP, map them to my church profile, and see a mini geofenced map view of the social actions my church has engaged in, **so I can** immediately visualize our local community footprint and parliamentary representation. | Postcode lookup via Parliament API with embedded geofenced map visualizer. |
| **CA-03** | `[MVP]` | **When** registering or claiming our presence, **I want to** fill in our church profile (name, denomination, weekly attendance, address, and contact details), **so I can** establish our verified civic identity. | Intuitive profile form with validation and draft saving. |
| **CA-04** | `[MVP]` | **When** detailing our community support, **I want to** select the social activities we engage in as a church (food banks, warm spaces, debt advice, youth clubs, etc.) along with rough participation numbers, **so I can** document our impact without administrative friction. | Categorized multi-select list with optional reach/frequency fields. |
| **CA-05** | `[MVP]` | **When** I write to my MP, **I want** the letter pre-filled with our activities and rough numbers, **so I can** send something credible without drafting it myself. | Automated constituent template incorporating selected initiatives and reach. |
| **CA-06** | `Post-MVP` | **When** I add our activities, **I want to** choose what’s public and what stays private, **so** people can find our services without my personal details being published. | Clear privacy controls / toggle per field. |
| **CA-07** | `Post-MVP` | **When** something changes (a new warm space, a youth club that’s paused), **I want to** update our listing quickly, **so** nobody turns up to something that’s stopped. | Lightweight claiming and edit link for verified contacts. |
| **CA-08** | `Post-MVP` | **When** the yearly check-in email arrives, **I want to** confirm our details in one click, **so** our listing stays verified without extra admin. | Automated annual freshness token email. |
| **CA-09** | `[MVP]` | **When** detailing our community support initiatives, **I want to** provide details such as service description, location, and contacts, **so I can** create a complete and useful record of our activity. | Intuitive form with validation and draft saving. |
| **CA-10** | `[MVP]` | **When** I add a community initiative, **I want to** capture the service lead and contact information, **so I can** enable future engagement and verification. | The user can record initiative lead information alongside a generic church contact. |
| **CA-11** | `[MVP]` | **When** I want to highlight a meaningful outcome, **I want to** provide testimonies or case studies, **so I can** show the human impact behind the statistics. | The user can add one or more case studies or testimonies to support impact reporting. |

---

## 2. MP’s Office (MP, Parliamentary Researchers & Policy Aides)

> **Advocacy & Policy Note:** MPs and researchers need credible, constituency-specific evidence they can champion in Parliament, APPGs, select committees, and minister questions.

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **MP-01** | `[MVP]` | **When** a church in my constituency writes to me, **I want to** see what all churches in the constituency are doing, **so I can** tell whether it’s one church or a wider network and decide where to visit. | Constituency-wide summary dashboard linked directly from the email. |
| **MP-02** | `[MVP]` | **When** I prepare for a debate, APPG gathering, or local campaign, **I want** figures and top talking points by activity type for my constituency, **so I can** cite local evidence rather than national averages. | Aggregated stats (e.g. total meals, warm space hours, volunteer hours). |
| **MP-03** | `Post-MVP` | **When** preparing for parliamentary gatherings or community summits, **I want to** request briefings and convene roundtables with church leaders on local challenges (cost of living, youth safety, mental wellbeing), **so** we can build opportunity-based partnerships. | Direct "Convene Dialogue / Briefing Request" action on the church profile. |
| **MP-04** | `Post-MVP` | **When** I want to visit or meet a church, **I want** a named contact and a direct way to reach them, **so** arranging visits doesn’t get lost in general correspondence. | Secure contact pathway for parliamentarians and policy aides. |

---

## 3. Evangelical Alliance Super Admin

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **EA-01** | `[MVP]` | **When** public data is imported, **I want to** review likely duplicates and weak matches, **so** the directory is trustworthy before it’s public. | Admin reconciliation and deduplication queue. |
| **EA-02** | `Post-MVP` | **When** a church claims or updates a listing, **I want to** check the person is genuine (for example, an email at the church’s own domain or a known contact), **so** we don’t publish false or malicious changes. | Domain validation / manual claim review. |
| **EA-03** | `Post-MVP` | **When** a church opts in to follow-up, **I want** a queue of these advocacy leads, ideally sent through to Dynamics, **so** the team can meet the “within 5 working days” promise in the form. | Lead capture table / CSV export / CRM integration. |
| **EA-04** | `Post-MVP` | **When** records haven’t been confirmed for a year, **I want them** flagged automatically, **so** stale information is chased or hidden. | Automated freshness state (Active, Pending Review, Stale). |
| **EA-05** | `Post-MVP` | **When** briefing parliament or the media, **I want** totals by constituency, nation and category, **so I can** make the national case with real numbers. | High-level reporting & exports. |

---

## 4. Public: People Looking for a Service (e.g., Food Bank, Warm Space)

> **Design Principle:** Design mobile-first, for slow connections, and in plain language. The people who most need this group’s stories are the least likely to be on a laptop.

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **PUB-01** | `[MVP]` | **When** I need help this week, **I want to** see what’s near me and when it’s open, **so I don’t** waste a journey. | Location-based search with explicit opening days and times. |
| **PUB-02** | `Post-MVP` | **When** I find a service, **I want to** know whether I can just turn up or need a referral or booking, **so I’m not** turned away at the door. | Clear badge: `Drop-in` vs `Referral Required` vs `Booking Needed`. |
| **PUB-03** | `Post-MVP` | **When** I’m unsure about going to a church for help, **I want to** know the service is open to everyone, whatever their faith, **so I feel** safe going. | "Open to all backgrounds" badge and welcoming copy. |
| **PUB-04** | `Post-MVP` | **When** I’m on my phone, **I want** directions and a call button in one tap, **so I can** act straight away. | One-tap `tel:` link and Google Maps navigation deep link. |

---

## 5. Public: Browsing Out of Curiosity

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **BRW-01** | `Post-MVP` | **When** I’m curious what local churches do beyond Sunday services, **I want to** browse my area by activity, **so I can** see the scale of what’s happening. | Category filter (e.g. Family & Youth, Crisis Support, Wellbeing). |
| **BRW-02** | `Post-MVP` | **When** something catches my eye, **I want to** see how to volunteer or donate, **so** curiosity can become involvement. | Volunteer / Donate call-to-action link per initiative. |
| **BRW-03** | `Post-MVP` | **When** someone shares a constituency page on social media, **I want to** grasp the impact at a glance, **so I understand** it without digging. | Social preview cards (OpenGraph metadata) with headline stats. |

---

## 6. External Developers & Partner Charities

| ID | Priority | User Story | Acceptance / Notes |
|:---|:---|:---|:---|
| **DEV-01** | `[MVP]` | **When** I build a signposting or referral service, **I want** an open JSON API of church-run services with freshness dates and a clear licence, **so I can** include them without scraping. | Standardized REST / JSON endpoint (`/api/churches`) with ISO date timestamps. |

---

## Notes & Technical Context for the Team

### Suggested Demo Journey (Hackathon Presentation)
1. **Church admin** claims a listing that was pre-filled from public data.
2. **Confirms their activities & impact numbers** in under 2 minutes.
3. **Sends the letter** to their local MP.
4. **MP’s office** clicks the link in the email and views the live constituency page (`/your-area`).

*This demonstrates Church Admin (CA-01 through CA-05: postcode & MP lookup, profile, activity selection, letter builder), MP's Office 1, and touches all four MVP deliverables in a complete end-to-end loop.*

### High-Risk Stories to Watch
1. **Super Admin 2 (Preventing False Claims):** Cheap to design for now, expensive to fix after launch. Ensure claim verification strategy is structured.
2. **Public Service Users 2 (Referral-Only Services):** Constituents turning up to referral-only services causes friction and distress; clearly distinguish open drop-ins from agency referrals.

### CRM / Dynamics Integration
- Microsoft Dynamics is the Evangelical Alliance's internal CRM.
- For advocacy follow-ups (Super Admin 3), ensure the data schema includes an exportable format (or direct webhook) to meet the *"contact within 5 working days"* commitment.
