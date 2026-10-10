// Maps the contact-MP form state to the LetterInput the letter templates use.
import { slugifyConstituency } from '@/lib/constituencies/slug'
import type { LetterInput } from './letter'

export type SendMethod = 'mailto' | 'download' | ''

export type Draft = {
  postcode: string
  mpName: string
  mpParty: string
  mpEmail: string
  mpConstituency: string
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

// One short UTM parameter on the link in the letter (no &, so it stays tidy in a plain-text email).
// It lets analytics, or the constituency page, tell that a visitor arrived from
// an MP letter (for analytics, a banner, a custom modal). Keep it opaque: never put names,
// emails or other personal details in a URL.
export const LETTER_LINK_PARAMS = 'utm_campaign=mp_outreach'

// `siteUrl` is the site's origin (e.g. https://example.org). It is only known in the browser,
// so it is passed in; without it, or without a constituency, the letter has no link.
export function toLetterInput(draft: Draft, siteUrl = ''): LetterInput {
  const mpName = draft.mpName.trim()
  const constituency = draft.mpConstituency.trim()
  const constituencyUrl =
    siteUrl && constituency
      ? `${siteUrl.replace(/\/+$/, '')}/constituencies/${slugifyConstituency(constituency)}?${LETTER_LINK_PARAMS}`
      : null
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
      constituency: draft.mpConstituency.trim(),
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
    ...(constituencyUrl && { constituency_url: constituencyUrl }),
  }
}
