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

const listeners = new Set<() => void>()

let cached: ChurchSubmission[] | null = null

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

let pendingCached: ChurchSubmission[] | null = null

function getSnapshot(): ChurchSubmission[] {
  if (cached === null) cached = readStore()
  return cached
}

function getPendingSnapshot(): ChurchSubmission[] {
  if (pendingCached === null) pendingCached = getSnapshot().filter((submission) => submission.status === 'pending')
  return pendingCached
}

function writeStore(submissions: ChurchSubmission[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(submissions))
  cached = submissions
  pendingCached = submissions.filter((submission) => submission.status === 'pending')
  listeners.forEach((listener) => listener())
}

export function subscribeToSubmissions(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
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
  return getPendingSnapshot()
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

export function updateSubmissionInitiatives(id: string, initiatives: string[]): ChurchSubmission[] {
  const next = readStore().map((submission) =>
    submission.id === id ? { ...submission, initiatives } : submission,
  )
  writeStore(next)
  return next
}
