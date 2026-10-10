# MP Email Tool Mock-up

This document has been converted from the PDF mock-up into Markdown.

## Overview

The MP Email Tool is a constituent-letter advocacy form for UK churches. It helps someone tell their MP what their church is doing in the constituency.

- Product: MP Email Tool
- Audience: UK church members and church leaders
- Goal: Contact an MP about local church activity and community impact
- Audience access: Open to anyone; no membership required
- Placement: Embedded as a multi-step block on the Evangelical Alliance site at `/contact-mp`
- Platform: Craft CMS + Freeform
- Stages: 7 total
- Send modes: via `mailto` or via the Evangelical Alliance on behalf of the constituent

## Extracted images

I found one embedded raster image in the PDF and saved it here:

- [page_3_1.png](C:/workspace/ea-gather-app/pdf_images/page_3_1.png)

![Page 3 extracted image](C:/workspace/ea-gather-app/pdf_images/page_3_1.png)

## Form flow

1. Intro
2. MP lookup
3. Church details
4. Activities
5. Message
6. Review & send
7. Confirmation

## Stage 1: Intro

Title: `STEP 1 OF 7 · INTRO`

"Let's start with your church postcode."

- The form asks for a church postcode and looks up the MP using Parliament's official Members API.
- Anyone can use it; no Evangelical Alliance membership is required.
- No sign-in is required.

Example input:

- Postcode: `DN1 3LN`

Actions:

- `Find my MP`

Helper text:

- "Takes about 5 minutes"
- "We'll save your draft"
- "Sent from your inbox"

## Stage 2: MP lookup

Title: `STEP 2 OF 7 · MP LOOKUP`

Question: "Is this your MP?"

Matched result:

- Constituency: Doncaster Central
- MP: Sarah Whitfield
- Party: Labour
- Email: `sarah.whitfield.mp@parliament.uk`
- Phone: `020 7219 1234`

Actions:

- `This isn't right — let me edit`
- `Back`
- `Yes, that's my MP`

## Stage 3: Church details

Title: `STEP 3 OF 7 · CHURCH DETAILS`

Question: "Tell us about your church."

- Church name: `St Mark's Doncaster`
- Denomination or network: `Church of England`
- Approximate weekly attendance: `180`
- Church address: `14 Greyfriars Road, Doncaster, DN1 3LN`

Sender details:

- Name: `Rev. Susan Whitaker`
- Role: `Vicar`
- Email: `s.whitaker@stmarksdoncaster.org`

Actions:

- `Back`
- `Next`

## Stage 4: Activities

Title: `STEP 4 OF 7 · ACTIVITIES`

Prompt: "What does your church do for the community?"

The form asks the user to tick regular activities, even small ones, and allows rough numbers. It is designed to feel broad and inclusive rather than exhaustive.

Example selections:

- Food bank or food pantry — 60 each week
- Warm space / community lounge
- Debt advice & financial wellbeing — 12 fortnightly
- Clothing or baby bank
- Parent / toddler & family groups — 35 each week
- Youth clubs or mentoring
- Holiday clubs / school-holiday meals
- Schools work or chaplaincy
- Older people's lunches & visits
- Mental health support groups
- ESOL classes / refugee support
- Recovery / addiction support
- Prison visiting or chaplaincy
- Street pastors or homelessness outreach
- Hosting community groups in our building
- Environmental / Eco Church work

Summary:

- `Selected 3 activities`

Actions:

- `Back`
- `Next`

## Stage 5: Message

Title: `STEP 5 OF 7 · MESSAGE`

Prompt: "In your own words."

Guidance:

- A single sentence is what makes the message read like a letter, not a form.
- Tell the MP what they should know about the church.

Suggested personal note:

> We’re seeing more working families come to our food bank than ever before. We’d love your help keeping the school holiday clubs running across our part of Doncaster.

Character guidance:

- `165 characters`
- Suggested length: `100–400`

Optional prompts:

- “We’re seeing demand grow for…”
- “A story that stuck with us this year…”
- “We partner with the council on…”
- “We’d love to invite you to visit on…”

Optional extras:

- “I'd be happy for the Evangelical Alliance advocacy team to follow up”
- “Send me the Evangelical Alliance's monthly advocacy update”

Actions:

- `Back`
- `Review email`

## Stage 6: Review & send

Title: `STEP 6 OF 7 · REVIEW & SEND`

Prompt: "Read it like your MP will."

This stage shows the final email the MP will receive. Yellow highlights indicate editable text; grey is standard template wording that helps offices recognise the format.

### Sample email content

```text
From Rev. Susan Whitaker <s.whitaker@stmarksdoncaster.org>
To Sarah Whitfield MP <sarah.whitfield.mp@parliament.uk>
Subject: From a church in Doncaster Central — what we're doing locally

Dear Sarah,

I'm writing as Vicar at St Mark's Doncaster, a church in your constituency of Doncaster Central.
I wanted to share a brief picture of what we do in Doncaster Central week-to-week — in case it's useful as you represent us in parliament.

Each week, our team and volunteers run:
- Food bank or food pantry — around 60 people
- Parent / toddler & family groups — around 35 people
- Debt advice & financial wellbeing — around 12 people, fortnightly

We’re seeing more working families come to our food bank than ever before. We’d love your help keeping the school holiday clubs running across our part of Doncaster.

The Evangelical Alliance, who help coordinate UK churches' engagement with parliament, would welcome the chance to meet with you and discuss how churches in your constituency are supporting the community. If that's something you'd be open to, they'd be glad to be in touch.

Thank you for the work you do for our area. We pray for you regularly, and we'd love to host you at the church should you ever like to visit.

With every good wish,
Rev. Susan Whitaker
Vicar, St Mark's Doncaster
14 Greyfriars Road, Doncaster, DN1 3LN
```

Actions:

- `Back`
- `Download .eml`
- `Open in my email client`

## Stage 7: Confirmation

Title: `STEP 7 OF 7 · CONFIRMATION`

Message: "Your draft is open in your email client."

- The email arrives directly in Sarah Whitfield's office from the sender's address.
- A copy is emailed to `s.whitaker@stmarksdoncaster.org`.

What happens next:

1. The email reaches the constituency office.
   - Replies usually take 2–6 weeks.
   - They come straight to the sender's inbox.
2. The advocacy team will be in touch within 5 working days.
   - A real person from the Evangelical Alliance follows up.
3. The sender is kept on file for next year.
   - If there are elections or boundary changes, they are notified if they want to update their MP.

Actions:

- `Send another from a different church`
- `Learn about Evangelical Alliance membership`

## Key notes

- The tool is designed to create a personal, church-specific email rather than a generic form response.
- It emphasizes local community action and service.
- It encourages constituency advocacy with a direct, human tone.
- It includes a final review step so the user can verify the email before sending.
