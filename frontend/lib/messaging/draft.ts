// Maps the contact-MP form state to the LetterInput the letter templates use.
import type { LetterInput } from './letter'

export type SendMethod = 'mailto' | 'download' | ''

export type Draft = {
  postcode: string
  mpName: string
  mpParty: string
  mpEmail: string
  churchName: string
  denomination: string
  attendance: string
  churchAddress: string
  senderName: string
  senderRole: string
  senderEmail: string
  selectedActivities: string[]
  activityCounts: Record<string, string>
  personalNote: string
  advocacyFollowUp: boolean
  monthlyUpdate: boolean
  sendMethod: SendMethod
}

export type Activity = {
  id: string
  label: string
  frequency?: string
}

export const activities: Activity[] = [
  { id: 'food-bank', label: 'Food bank or food pantry', frequency: 'each week' },
  { id: 'warm-space', label: 'Warm space / community lounge' },
  { id: 'debt-advice', label: 'Debt advice & financial wellbeing', frequency: 'fortnightly' },
  { id: 'clothing-bank', label: 'Clothing or baby bank' },
  { id: 'family-groups', label: 'Parent / toddler & family groups', frequency: 'each week' },
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
]

export function toLetterInput(draft: Draft): LetterInput {
  const mpName = draft.mpName.trim()
  return {
    sender: {
      name: draft.senderName.trim(),
      role: draft.senderRole.trim() || null,
      email: draft.senderEmail.trim() || null,
    },
    church: {
      name: draft.churchName.trim() || 'our church',
      address: draft.churchAddress.trim() || null,
      postcode: draft.postcode.trim(),
    },
    mp: {
      display_name: mpName ? `${mpName} MP` : 'there',
      first_name: mpName.split(/\s+/)[0] || null,
      email: draft.mpEmail.trim(),
      constituency: '',
    },
    activities: activities
      .filter((activity) => draft.selectedActivities.includes(activity.id))
      .map((activity) => {
        const count = Number(draft.activityCounts[activity.id])
        return {
          name: activity.label,
          days: activity.frequency ?? null,
          count: Number.isInteger(count) && count > 0 ? count : null,
          unit: 'people',
        }
      }),
    message: {
      personal_note: draft.personalNote,
      include_prayer_line: false,
      mention_evangelical_alliance: draft.advocacyFollowUp,
    },
    outcome: { type: 'visit' },
  }
}
