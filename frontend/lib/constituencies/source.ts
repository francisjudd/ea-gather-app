// The ONLY place that knows where constituency data comes from.
//
// Pages and components call `constituencies.list()` / `constituencies.get(slug)` and never
// touch files or URLs. Data is fetched at runtime from the FastAPI backend
// (/openapi/areas and /openapi/areas/{slug}), so it always reflects the live database.

import { api } from '@/lib/api/client'
import type { ConstituencyDetail, ConstituencySummary } from './types'

export interface ConstituencyRepository {
  list(): Promise<ConstituencySummary[]>
  get(slug: string): Promise<ConstituencyDetail | null>
}

function createApiRepository(): ConstituencyRepository {
  return {
    list() {
      return api.listConstituencies()
    },
    async get(slug) {
      // Slugs are [a-z0-9-] only; reject anything else before hitting the API.
      if (!/^[a-z0-9-]+$/.test(slug)) return null
      try {
        return await api.getConstituency(slug)
      } catch {
        return null
      }
    },
  }
}

export const constituencies: ConstituencyRepository = createApiRepository()
