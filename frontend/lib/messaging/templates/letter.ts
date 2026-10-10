// Plain-language wording for the MP letter. Edit the text here; no logic needed.
// Chunk markers ("@@ template|data|personal|outcome") drive the review-screen highlights.
// Variables are the LetterInput fields (see ../letter.ts) plus a few helpers:
//   greeting_name, sender.role_lower, activities[].line, is.<outcome type> (is.visit_any covers visit and visit_photo)

export const letterTemplate = `
@@ template
Dear {{greeting_name}},

@@ data
I am {{#sender.role_lower}}the {{.}} at {{/sender.role_lower}}{{^sender.role_lower}}part of {{/sender.role_lower}}{{church.name}} ({{church.postcode}}){{#church.area}}, in {{.}}{{/church.area}}, and I am writing as one of your constituents.

@@ data
{{#totals.people_per_week_text}}
Each week we welcome {{.}} through our community activities:

{{/totals.people_per_week_text}}
{{#activities}}
- {{line}}
{{/activities}}

@@ personal
{{#message.personal_note}}
{{.}}

{{/message.personal_note}}
@@ data
{{#constituency_rollup}}
We are one of {{church_count}} churches in {{mp.constituency}} running at least {{activity_count}} community activities. You can see them all here: {{rollup_url}}

{{/constituency_rollup}}
@@ outcome
{{#is.visit_any}}We would love you to visit{{#outcome.details.activity}} our {{.}}{{/outcome.details.activity}}{{#outcome.details.day}} on {{.}}{{/outcome.details.day}}, whenever suits you.{{#is.visit_photo}} It could also be a good moment for a photo with our volunteers.{{/is.visit_photo}}
{{/is.visit_any}}
{{#is.missed_anything}}
I would be grateful to know whether your office sees needs in your casework that local churches could help with, as we would like to serve where the gaps are.
{{/is.missed_anything}}
{{#is.signposting}}
I would be grateful if you would share our services with your constituency caseworkers so they can refer constituents. Our contact details are on the page linked above.
{{/is.signposting}}
{{#is.meeting}}
I would welcome a short meeting, or a slot at one of your surgeries, to talk about our work{{#outcome.details.availability}}. {{.}}{{/outcome.details.availability}}.
{{/is.meeting}}
{{#is.keep_informed}}
We would be glad to keep you updated on our work and to be a point of contact for you in the community.
{{/is.keep_informed}}

@@ template
Thank you for all you do for our community.{{#message.include_prayer_line}} We pray for you and your team regularly.{{/message.include_prayer_line}}

With every good wish,
@@ data
{{sender.name}}
{{#sender.role}}
{{.}}
{{/sender.role}}
{{church.name}}
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
  activity: '{{first_activity}} in {{place}}',
}
