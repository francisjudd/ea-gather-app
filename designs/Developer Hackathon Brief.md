**Developer Hackathon Brief: "More Than Sunday" Church Social Action Platform**

**Executive Summary & Vision**

Across the UK, local churches provide vital frontline support—from food banks and warm spaces to youth work and debt advice. However, much of this work remains fragmented, unmeasured, and invisible to policymakers.

The Evangelical Alliance is commissioning a nationwide digital platform to map church-led social action. Over this hackathon, we are taking this initiative from zero to one. Our goal is to build an open, maintainable system that:

-   Empowers churches to record their community impact and contact their local MP.
-   Equips policymakers and church leaders with geographical insights into community needs and provisions.
-   Exposes an open, public API so external charities and civic platforms can consume and build on this data.

**Target Audience & User Stories**

-   **Church Leaders:** Seamlessly input social initiatives, update service details, and auto-generate an advocacy email to their local MP.
-   **Policymakers & MPs:** View visual data and constituency-level heatmaps showcasing local community support infrastructure.
-   **External Developers / Civic Tech Organisations:** Consume clean, structured UK church social action data through a public REST/GraphQL API.

**Core Technical Tracks & Scope**

**1\. Data Schema & Ingestion**

-   **Taxonomy:** Design a relational schema capturing church metadata (name, denomination, postcode, lead contact) mapped to structured social action categories (practical support, youth/family, wellbeing, vulnerable groups, environmental).
-   **Participation Metrics:** Capture both qualitative case studies and quantitative indicators (e.g., families served/month, volunteer hours).
-   **Lifecycle & Freshness:** Implement a mechanism to ensure records stay fresh (e.g., scheduled email verification links, annual confirmation pings, or staleness flags).

**2\. Frontend Directory & Visualisation**

-   **Design Anchor:** Use the **Evangelical Alliance "Find a Church"** directory layout as your primary UI reference point.
-   **Core Views:**
    -   **Interactive Map / List Split View:** Responsive split interface featuring a map UI alongside a search result list.
    -   **Facet & Filter Engine:** Filter by geographic boundary (postcode radius, local authority, Westminster constituency) and initiative type (e.g., Food Bank, Debt Advice, Warm Spaces).
    -   **Church Profile View:** Summary cards highlighting active projects, operating hours, and verified status.

**3\. Advocacy Engine & MP Outreach ("More Than Sunday")**

-   **Postcode-to-MP Lookup:** Automatically resolve constituency and current MP details via postcode lookups (e.g., using TheyWorkForYou or the UK Parliament API).
-   **Letter Generator:** A dynamic template engine that combines church impact statistics, selected categories, and custom qualitative stories into a tailored message.
-   **Dispatch Pipeline:** Generate client-side mailto: hooks or server-side dispatches, incorporating profanity filters and tracking consent checkboxes for database inclusion.

**Definition of Hackathon Success (MVP Deliverables)**

1.  **Working Map/Directory:** A searchable UI inspired by the EA directory layout displaying populated seed data.
2.  **End-to-End Submission Flow:** A working form capturing a church's social initiatives and writing to the database.
3.  **Dynamic MP Advocate Tool:** Postcode entry resolving to an MP with a pre-filled, editable template letter.
4.  **Documented Endpoint:** At least one live API endpoint serving structured project data in JSON format.