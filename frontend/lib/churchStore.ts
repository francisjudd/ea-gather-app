// Church submission store.
//
// This is a frontend-only, localStorage-backed store so the submit and admin
// flows work before the backend is connected. The exported functions are the
// single data-access surface; swap their bodies for fetch() calls to the API
// once the backend contract is defined.

export type ChurchSubmission = {
  id: string
  name: string
  denomination: string
  address: string
  place: string
  postcode: string
  operatingHours: string
  contactName: string
  contactEmail: string
  initiatives: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

const storageKey = 'ea-church-submissions-v1'

function readStore(): ChurchSubmission[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSubmission)
  } catch {
    return []
  }
}

function writeStore(submissions: ChurchSubmission[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(submissions))
}

function isSubmission(value: unknown): value is ChurchSubmission {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && typeof item.status === 'string'
}

export function getSubmissions(): ChurchSubmission[] {
  return readStore()
}

export function getPendingSubmissions(): ChurchSubmission[] {
  return readStore().filter((submission) => submission.status === 'pending')
}

export function submitChurch(input: Omit<ChurchSubmission, 'id' | 'status' | 'submittedAt'>): ChurchSubmission {
  const submission: ChurchSubmission = {
    ...input,
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  writeStore([...readStore(), submission])
  return submission
}

export function setSubmissionStatus(id: string, status: ChurchSubmission['status']): ChurchSubmission[] {
  const next = readStore().map((submission) =>
    submission.id === id ? { ...submission, status } : submission,
  )
  writeStore(next)
  return next
}

export function approveChurch(id: string): ChurchSubmission[] {
  return setSubmissionStatus(id, 'approved')
}

export function rejectChurch(id: string): ChurchSubmission[] {
  return setSubmissionStatus(id, 'rejected')
}
