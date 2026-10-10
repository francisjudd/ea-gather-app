// Plain-language wording for the MP letter. Edit the text here; no logic needed.
// Chunk markers ("@@ template|data|personal|outcome") drive the review-screen highlights.
// Variables are the LetterInput fields (see ../letter.ts) plus a few helpers:
//   greeting_name, has_activities, activities[].line, is.<outcome type> (is.visit_any covers visit and visit_photo)

export const letterTemplate = `
@@ template
Dear {{greeting_name}},

@@ data
{{#sender.role}}I'm writing as {{.}} at {{church.name}}{{/sender.role}}{{^sender.role}}I'm writing from {{church.name}}{{/sender.role}}, a church in your constituency.

@@ template
I wanted to share a brief picture of what we do in {{#mp.constituency}}{{.}}{{/mp.constituency}}{{^mp.constituency}}your constituency{{/mp.constituency}} week-to-week in case it's useful as you represent us in parliament.

@@ data
{{#has_activities}}
Each week, our team and volunteers run:
{{#activities}}
* {{line}}
{{/activities}}

{{/has_activities}}
@@ personal
{{#message.personal_note}}
{{.}}

{{/message.personal_note}}
@@ data
{{#constituency_rollup}}
We are one of {{church_count}} churches in {{mp.constituency}} running at least {{activity_count}} community activities. You can see them all here: {{rollup_url}}

{{/constituency_rollup}}
@@ template
{{#message.mention_evangelical_alliance}}
The Evangelical Alliance, who help coordinate UK churches' engagement with parliament, would welcome the chance to meet with you and discuss how churches in your constituency are supporting the community. If that's something you'd be open to, you can contact them on advocacy@eauk.org.

{{/message.mention_evangelical_alliance}}
Thank you for the work you do for our area.{{#message.include_prayer_line}} We pray for you and your team regularly.{{/message.include_prayer_line}}

@@ outcome
{{#is.visit_any}}We'd love to host you at our {{#outcome.details.activity}}{{.}}{{/outcome.details.activity}}{{^outcome.details.activity}}church{{/outcome.details.activity}}{{#outcome.details.day}} on {{.}}{{/outcome.details.day}} at a time that suited you.{{#is.visit_photo}} It could also be a good moment for a photo with our volunteers.{{/is.visit_photo}}
{{/is.visit_any}}
{{#is.missed_anything}}
I would be grateful to know whether your office sees needs in your casework that local churches could help with, as we would like to serve where the gaps are.
{{/is.missed_anything}}
{{#is.signposting}}
I would be grateful if you would share our services with your constituency caseworkers so they can refer constituents. Our contact details are below.
{{/is.signposting}}
{{#is.meeting}}
I would welcome a short meeting, or a slot at one of your surgeries, to talk about our work{{#outcome.details.availability}}. {{.}}{{/outcome.details.availability}}.
{{/is.meeting}}
{{#is.keep_informed}}
We would be glad to keep you updated on our work and to be a point of contact for you in the community.
{{/is.keep_informed}}

@@ template
With every good wish,
@@ data
{{sender.name}}
{{#sender.role}}{{.}}, {{/sender.role}}{{church.name}}
{{#church.address}}
{{.}}
{{/church.address}}
{{#sender.phone}}
{{.}}
{{/sender.phone}}
`

// Subject lines: max 60 characters (enforced in code), place name early.
export const subjectTemplates = {
  invitation: 'Invitation to visit {{church.name}}{{#church.area}}, {{.}}{{/church.area}}',
  activity: '{{first_activity}}{{#place}} in {{.}}{{/place}}',
}
