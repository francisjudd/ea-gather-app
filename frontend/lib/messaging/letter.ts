// Letter-to-MP types and the deterministic fallback template.
// LetterInput is the same JSON the model is given, so the fallback and the
// generated letter are always built from identical data.

import { buildMailtoUrl } from './mailto'
import { renderTaggedTemplate, renderTemplate } from './template'
import { letterTemplate, subjectTemplates } from './templates/letter'

export interface LetterInput {
  sender: { name: string; role?: string | null; email?: string | null; phone?: string | null }
  church: { name: string; address?: string | null; postcode: string; area?: string | null }
  mp: { display_name: string; first_name?: string | null; email: string; constituency: string }
  activities: {
    name: string
    days?: string | null
    count?: number | null
    unit?: string | null
    partner?: string | null
  }[]
  totals?: { people_per_week_text?: string | null }
  message?: {
    personal_note?: string | null
    include_prayer_line?: boolean
    mention_evangelical_alliance?: boolean
  }
  constituency_rollup?: { church_count: number; activity_count: number; rollup_url: string } | null
  outcome: {
    type: 'visit' | 'visit_photo' | 'missed_anything' | 'signposting' | 'meeting' | 'keep_informed'
    details?: { activity?: string; day?: string; availability?: string } | null
  }
}

export type SegmentKind = 'template' | 'data' | 'personal' | 'outcome'
export interface LetterSegment {
  kind: SegmentKind
  text: string
}

const MAX_ACTIVITIES = 5
const MAX_SUBJECT_LENGTH = 60

const clamp = (text: string) =>
  text.length <= MAX_SUBJECT_LENGTH ? text : `${text.slice(0, MAX_SUBJECT_LENGTH - 1).trimEnd()}…`

// "Community Outreach Lead" -> "community outreach lead". Acronyms (CEO) are kept, and
// everything after a preposition is left alone so names survive ("Vicar of St Mark's").
const PREPOSITIONS = new Set(['of', 'at', 'for', 'in', 'to'])
function lowerRole(role: string) {
  let keep = false
  return role
    .split(/(\s+)/)
    .map((word) => {
      if (PREPOSITIONS.has(word.toLowerCase())) keep = true
      return keep || word === word.toUpperCase() ? word : word.toLowerCase()
    })
    .join('')
}

function activityLine(a: LetterInput['activities'][number]) {
  const reach = a.count != null ? `around ${a.count}${a.unit ? ` ${a.unit}` : ''}` : ''
  const main = [a.name, [a.days, reach].filter(Boolean).join(', ')].filter(Boolean).join(': ')
  return `${main}${a.partner ? ` (with ${a.partner})` : ''}`
}

// Adds the few derived values the templates need. Wording stays in templates/.
function buildView(input: LetterInput) {
  const { sender, mp, message, outcome } = input
  return {
    ...input,
    greeting_name: mp.first_name || mp.display_name,
    sender: { ...sender, role_lower: sender.role ? lowerRole(sender.role) : '' },
    message: { ...message, personal_note: message?.personal_note?.trim() ?? '' },
    has_activities: input.activities.length > 0,
    activities: input.activities.slice(0, MAX_ACTIVITIES).map((a) => ({ ...a, line: activityLine(a) })),
    is: { [outcome.type]: true, visit_any: outcome.type === 'visit' || outcome.type === 'visit_photo' },
  }
}

export function renderLetterFallback(input: LetterInput) {
  const view = buildView(input)
  const segments = renderTaggedTemplate<SegmentKind>(letterTemplate, view)
  segments[segments.length - 1].text = segments[segments.length - 1].text.trimEnd()

  const subjectView = {
    ...view,
    first_activity: input.activities[0]?.name ?? '',
    place: input.church.area || input.mp.constituency || input.church.postcode,
  }
  const subjects = [
    renderTemplate(subjectTemplates.invitation, subjectView),
    input.activities[0] ? renderTemplate(subjectTemplates.activity, subjectView) : '',
  ]
    .filter(Boolean)
    .map(clamp)

  return { subjects, segments, body: segments.map((segment) => segment.text).join('') }
}

export function buildLetterMailto(input: LetterInput, subject: string, body: string) {
  return buildMailtoUrl({ to: input.mp.email, cc: input.sender.email ?? undefined, subject, body })
}
