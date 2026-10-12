// Shared initiative taxonomy used across the church directory, submit form,
// and admin review view. The backend (/openapi/initiatives) is the source of
// truth; it returns the categories stored in the database. The static list below
// is a fallback so components can render without a fetch, and `loadInitiatives()`
// lets them refresh it from the API.

import { api } from './api/client'

export type Initiative = {
  id: string
  label: string
}

export const initiativeTypes: Initiative[] = [
  { id: 'centre', label: 'Centre' },
  { id: 'charity-shop', label: 'Charity Shop' },
  { id: 'debt-help', label: 'Debt help' },
  { id: 'divisional-office', label: 'Divisional office' },
  { id: 'early-intervention', label: 'Early Intervention' },
  { id: 'employment-service', label: 'Employment Service' },
  { id: 'foodbanks', label: 'Foodbanks' },
  { id: 'homelessness-service', label: 'Homelessness Service' },
  { id: 'job-clubs', label: 'Job clubs' },
  { id: 'life-skills', label: 'Life skills' },
  { id: 'make-lunch', label: 'Make Lunch' },
  { id: 'older-people-service', label: 'Older People Service' },
  { id: 'salvation-army-church', label: 'Salvation Army church' },
  { id: 'warm-spaces', label: 'Warm spaces' },
]

export type InitiativeId = (typeof initiativeTypes)[number]['id']

export function toInitiativeLabels(initiatives: Initiative[]): Record<string, string> {
  return Object.fromEntries(initiatives.map((initiative) => [initiative.id, initiative.label]))
}

export const initiativeLabels: Record<string, string> = toInitiativeLabels(initiativeTypes)

/** Fetch the initiative taxonomy from the API, falling back to the static list. */
export async function loadInitiatives(): Promise<Initiative[]> {
  try {
    return await api.listInitiatives()
  } catch {
    return initiativeTypes
  }
}
