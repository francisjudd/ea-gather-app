// Typed client for the Evangelical Alliance Gather API.
//
// The frontend always calls same-origin `/openapi/...` URLs. In production
// vercel.json rewrites `/openapi/:path*` to the FastAPI service (stripping the
// prefix); in development next.config.ts does the same. This module is the single
// place that knows the URL shapes, so components never build URLs by hand.

import type { components } from './schema'

type Church = components['schemas']['Church']
type ChurchSubmission = components['schemas']['ChurchSubmission']
type ChurchSubmissionIn = components['schemas']['ChurchSubmissionIn']
type GeocodeResult = components['schemas']['GeocodeResult']
type Initiative = components['schemas']['Initiative']
type Mp = components['schemas']['Mp']
type SubmissionUpdate = components['schemas']['SubmissionUpdate']

export type { Church, ChurchSubmission, ChurchSubmissionIn, GeocodeResult, Initiative, Mp, SubmissionUpdate }

export type ListChurchesParams = {
  q?: string
  letter?: string
  initiatives?: string
  lat?: number
  lng?: number
  radius?: number
  limit?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, detail: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

// Server-side fetches (server components, generateStaticParams, route handlers)
// run on the Node server where the `/openapi` rewrite does not apply, so they
// must target the backend directly. Client-side fetches use same-origin
// `/openapi/...` URLs, which vercel.json (prod) and next.config.ts (dev) rewrite.
const devBackendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

function resolveUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server: hit the backend directly, preserving the `/openapi` prefix.
    return `${devBackendUrl}${path}`
  }
  return path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveUrl(path), init)
  if (!response.ok) {
    let detail: unknown
    try {
      detail = await response.json()
    } catch {
      detail = null
    }
    throw new ApiError(response.status, detail)
  }
  return response.json() as Promise<T>
}

function queryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const api = {
  listChurches(params: ListChurchesParams = {}): Promise<Church[]> {
    return request<Church[]>(`/openapi/churches${queryString(params)}`)
  },

  getChurch(id: string): Promise<Church> {
    return request<Church>(`/openapi/churches/${encodeURIComponent(id)}`)
  },

  submitChurch(input: ChurchSubmissionIn): Promise<ChurchSubmission> {
    return request<ChurchSubmission>('/openapi/churches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  listInitiatives(): Promise<Initiative[]> {
    return request<Initiative[]>('/openapi/initiatives')
  },

  geocode(q: string): Promise<GeocodeResult> {
    return request<GeocodeResult>(`/openapi/geocode${queryString({ q })}`)
  },

  lookupMp(postcode: string): Promise<Mp> {
    return request<Mp>(`/openapi/mp/lookup${queryString({ postcode })}`)
  },

  listSubmissions(status?: 'pending' | 'approved' | 'rejected', token?: string): Promise<ChurchSubmission[]> {
    return request<ChurchSubmission[]>(`/openapi/admin/submissions${queryString({ status })}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  updateSubmission(id: string, update: SubmissionUpdate, token?: string): Promise<ChurchSubmission> {
    return request<ChurchSubmission>(`/openapi/admin/submissions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(update),
    })
  },
}
