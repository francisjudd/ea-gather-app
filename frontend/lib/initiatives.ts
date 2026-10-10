// Shared initiative taxonomy used across the church directory, submit form,
// and admin review view. Keep this in one place so the labels stay consistent.

export const initiativeTypes = [
  { id: 'food-bank', label: 'Food bank or food pantry' },
  { id: 'warm-space', label: 'Warm space / community lounge' },
  { id: 'debt-advice', label: 'Debt advice & financial wellbeing' },
  { id: 'clothing-bank', label: 'Clothing or baby bank' },
  { id: 'family-groups', label: 'Parent / toddler & family groups' },
  { id: 'youth', label: 'Youth clubs or mentoring' },
  { id: 'holiday-clubs', label: 'Holiday clubs / school-holiday meals' },
  { id: 'schools', label: 'Schools work or chaplaincy' },
  { id: 'older-people', label: "Older people's lunches & visits" },
  { id: 'mental-health', label: 'Mental health support groups' },
  { id: 'esol', label: 'ESOL classes / refugee support' },
  { id: 'recovery', label: 'Recovery / addiction support' },
  { id: 'prison', label: 'Prison visiting or chaplaincy' },
  { id: 'street-pastors', label: 'Street pastors or homelessness outreach' },
  { id: 'community-groups', label: 'Hosting community groups in our building' },
  { id: 'eco-church', label: 'Environmental / Eco Church work' },
] as const

export type InitiativeId = (typeof initiativeTypes)[number]['id']

export const initiativeLabels: Record<string, string> = Object.fromEntries(
  initiativeTypes.map((initiative) => [initiative.id, initiative.label]),
)
