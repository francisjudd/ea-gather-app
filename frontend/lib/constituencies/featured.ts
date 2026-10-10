// A fixed, server-rendered set of example services for the /services page, so it has real,
// indexable content before anyone searches.
//
// "Top" means the best-documented listings: the two most complete records from each substantial
// category (one with a website, a phone number and a street address beats one without),
// interleaved so the first cards show a mix of types.

import { constituencies } from './source'
import type { ConstituencyService } from './types'

export type FeaturedService = ConstituencyService & {
  constituencyName: string
  constituencySlug: string
}

// Ignore tiny categories (a handful of records) so the examples are representative.
const MIN_CATEGORY_SIZE = 50
const PER_CATEGORY = 2

const completeness = (service: ConstituencyService) =>
  (service.website ? 2 : 0) + (service.phone ? 1 : 0) + (/^\d/.test(service.address ?? '') ? 1 : 0)

export async function getFeaturedServices(limit = 12): Promise<FeaturedService[]> {
  const list = await constituencies.list()
  const details = await Promise.all(list.filter((item) => item.serviceCount > 0).map((item) => constituencies.get(item.slug)))

  const byCategory = new Map<string, FeaturedService[]>()
  for (const detail of details) {
    if (!detail) continue
    for (const service of detail.services) {
      if (!service.category) continue
      const bucket = byCategory.get(service.category) ?? []
      bucket.push({ ...service, constituencyName: detail.name, constituencySlug: detail.slug })
      byCategory.set(service.category, bucket)
    }
  }

  const buckets = [...byCategory.values()]
    .filter((bucket) => bucket.length >= MIN_CATEGORY_SIZE)
    .sort((a, b) => b.length - a.length)
    .map((bucket) =>
      bucket
        .sort((a, b) => completeness(b) - completeness(a) || a.name.localeCompare(b.name))
        .slice(0, PER_CATEGORY),
    )

  // Round-robin across categories: first the best of each, then the second best of each.
  const featured: FeaturedService[] = []
  for (let rank = 0; rank < PER_CATEGORY; rank++) {
    for (const bucket of buckets) if (bucket[rank]) featured.push(bucket[rank])
  }
  return featured.slice(0, limit)
}
