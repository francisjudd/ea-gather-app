// Typed client for the Evangelical Alliance Gather API.
//
// The frontend always calls same-origin `/openapi/...` URLs. Vercel routes
// those paths to FastAPI and local Next.js development proxies them to uvicorn.
// This module is the single place that knows the URL shapes.

import type { components } from './schema'

type Church = components['schemas']['Church']
type ChurchSubmission = components['schemas']['ChurchSubmission']
type ChurchSubmissionIn = components['schemas']['ChurchSubmissionIn']
type ConstituencyDetail = components['schemas']['ConstituencyDetail']
type ConstituencySummary = components['schemas']['ConstituencySummary']
type GeocodeResult = components['schemas']['GeocodeResult']
type Initiative = components['schemas']['Initiative']
type Mp = components['schemas']['Mp']
type SubmissionUpdate = components['schemas']['SubmissionUpdate']

export type {
  Church,
  ChurchSubmission,
  ChurchSubmissionIn,
  ConstituencyDetail,
  ConstituencySummary,
  GeocodeResult,
  Initiative,
  Mp,
  SubmissionUpdate,
}

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

// Server-side rendering bypasses the browser's same-origin request. On Vercel,
// use this deployment's URL so its /openapi rewrite selects the matching API
// service (including Preview deployments). Locally, use uvicorn; BACKEND_URL
// remains available for a separately hosted development API.
const backendBaseUrl = process.env.BACKEND_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:8000')

function resolveUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server: hit the backend directly, preserving the `/openapi` prefix.
    return `${backendBaseUrl}${path}`
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

  listConstituencies(): Promise<ConstituencySummary[]> {
    return request<ConstituencySummary[]>('/openapi/areas')
  },

  listConstituencyDetails(): Promise<ConstituencyDetail[]> {
    return request<ConstituencyDetail[]>('/openapi/areas/details')
  },

  getConstituency(slug: string): Promise<ConstituencyDetail> {
    return request<ConstituencyDetail>(`/openapi/areas/${encodeURIComponent(slug)}`)
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
