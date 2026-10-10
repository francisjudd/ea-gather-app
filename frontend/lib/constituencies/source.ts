// The ONLY place that knows where constituency data comes from.
//
// Pages and components call `constituencies.list()` / `constituencies.get(slug)` and never
// touch files or URLs. To move to the FastAPI backend, write an `apiRepository` that
// implements ConstituencyRepository with fetch() calls and export it as `constituencies`.
// Nothing else changes (types.ts will be replaced by types from lib/api/schema.d.ts).
//
// Today: JSON generated from data-source/combined.db (npm run data:constituencies).

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ConstituencyDetail, ConstituencySummary } from './types'

export interface ConstituencyRepository {
  list(): Promise<ConstituencySummary[]>
  get(slug: string): Promise<ConstituencyDetail | null>
}

const dir = join(process.cwd(), 'lib', 'constituencies', 'generated')

function createFileRepository(): ConstituencyRepository {
  let indexCache: Promise<ConstituencySummary[]> | undefined

  return {
    list() {
      indexCache ??= readFile(join(dir, 'index.json'), 'utf8').then((text) => JSON.parse(text))
      return indexCache
    },
    async get(slug) {
      // Slugs are [a-z0-9-] only; reject anything else before touching the filesystem.
      if (!/^[a-z0-9-]+$/.test(slug)) return null
      try {
        return JSON.parse(await readFile(join(dir, 'by-slug', `${slug}.json`), 'utf8'))
      } catch {
        return null
      }
    },
  }
}

export const constituencies: ConstituencyRepository = createFileRepository()
