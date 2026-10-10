// Church submission store.
//
// The backend (/openapi/churches POST and /openapi/admin/submissions) is the
// source of truth. The exported functions are the single data-access surface;
// they call the API rather than localStorage.

import { api, type ChurchSubmission } from './api/client'

export type { ChurchSubmission }

export function subscribeToSubmissions(_listener: () => void): () => void {
  // The admin view refetches on mount; there is no client-side store to subscribe to.
  return () => {}
}

export async function getSubmissions(token?: string): Promise<ChurchSubmission[]> {
  return api.listSubmissions(undefined, token)
}

export async function getPendingSubmissions(token?: string): Promise<ChurchSubmission[]> {
  return api.listSubmissions('pending', token)
}

export async function submitChurch(input: Omit<ChurchSubmission, 'id' | 'status' | 'submittedAt'>): Promise<ChurchSubmission> {
  return api.submitChurch(input)
}

export async function setSubmissionStatus(id: string, status: ChurchSubmission['status'], token?: string): Promise<ChurchSubmission[]> {
  await api.updateSubmission(id, { status }, token)
  return api.listSubmissions(undefined, token)
}

export async function approveChurch(id: string, token?: string): Promise<ChurchSubmission[]> {
  return setSubmissionStatus(id, 'approved', token)
}

export async function rejectChurch(id: string, token?: string): Promise<ChurchSubmission[]> {
  return setSubmissionStatus(id, 'rejected', token)
}

export async function updateSubmissionInitiatives(id: string, initiatives: string[], token?: string): Promise<ChurchSubmission[]> {
  await api.updateSubmission(id, { initiatives }, token)
  return api.listSubmissions(undefined, token)
}
