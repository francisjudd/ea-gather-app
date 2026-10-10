// A fixed, server-rendered set of highlights for the /services page, so it has real, indexable
// content before anyone searches. Highlights are grouped by a handful of chosen places.
//
// Services have a postcode but no city, so a place is defined by its postcode areas. That is
// approximate (a postcode area is not a city boundary) but needs no extra data.
//
// Within a place the picks are not alphabetical: categories are interleaved (so a place is not
// all warm spaces), and within a category the most complete records (website, phone, street
// address) come first, with a stable hash of the id breaking ties.

import { constituencies } from './source'
import type { ConstituencyService } from './types'

export type FeaturedService = ConstituencyService & {
  constituencyName: string
  constituencySlug: string
}

export type FeaturedGroup = {
  city: string
  nation: string
  totalCount: number
  services: FeaturedService[]
  /** The constituencies with the most listings in this place, for onward links. */
  constituencies: { name: string; slug: string }[]
}

type PlaceConfig = { city: string; nation: string; areas: string[] }

// Chosen highlights: the biggest English places, plus one each for Wales, Scotland and
// Northern Ireland. Order here is the order on the page.
const FEATURED_PLACES: PlaceConfig[] = [
  { city: 'London', nation: 'England', areas: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'] },
  { city: 'Birmingham', nation: 'England', areas: ['B'] },
  { city: 'Newcastle', nation: 'England', areas: ['NE'] },
  { city: 'Cardiff', nation: 'Wales', areas: ['CF'] },
  { city: 'Glasgow', nation: 'Scotland', areas: ['G'] },
  { city: 'Belfast', nation: 'Northern Ireland', areas: ['BT'] },
]

// Interleave order. Food banks first: they have the most complete records.
const CATEGORY_ORDER = [
  'Foodbanks',
  'Warm spaces',
  'Homelessness Service',
  'Employment Service',
  'Salvation Army church',
  'Charity Shop',
]
const PER_PLACE = 8
const TOP_CONSTITUENCIES = 5

const completeness = (service: ConstituencyService) =>
  (service.website ? 2 : 0) + (service.phone ? 1 : 0) + (/^\d/.test(service.address ?? '') ? 1 : 0)

// Small stable string hash, so ties break the same way on every build without being alphabetical.
const hash = (value: string) => [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7)

const postcodeArea = (postcode: string | null) => postcode?.toUpperCase().match(/^([A-Z]{1,2})\d/)?.[1] ?? null

export async function getFeaturedByCity(perPlace = PER_PLACE): Promise<FeaturedGroup[]> {
  const list = await constituencies.list()
  const details = (
    await Promise.all(list.filter((item) => item.serviceCount > 0).map((item) => constituencies.get(item.slug)))
  ).filter((detail) => detail != null)

  return FEATURED_PLACES.map((place) => {
    const inPlace: FeaturedService[] = []
    const perConstituency = new Map<string, { name: string; slug: string; count: number }>()

    for (const detail of details) {
      for (const service of detail.services) {
        const area = postcodeArea(service.postcode)
        if (!area || !place.areas.includes(area)) continue
        inPlace.push({ ...service, constituencyName: detail.name, constituencySlug: detail.slug })
        const entry = perConstituency.get(detail.slug) ?? { name: detail.name, slug: detail.slug, count: 0 }
        entry.count++
        perConstituency.set(detail.slug, entry)
      }
    }

    // The source lists some services twice, sometimes with a different postcode. In a short list of
    // highlights, two cards with the same name look like a mistake, so show each name once.
    const seen = new Set<string>()
    const unique = inPlace.filter((service) => {
      const key = service.name.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const byCategory = CATEGORY_ORDER.map((category) =>
      unique
        .filter((service) => service.category === category)
        .sort((a, b) => completeness(b) - completeness(a) || hash(a.id) - hash(b.id)),
    )

    const picks: FeaturedService[] = []
    for (let rank = 0; picks.length < perPlace; rank++) {
      const before = picks.length
      for (const bucket of byCategory) if (bucket[rank] && picks.length < perPlace) picks.push(bucket[rank])
      if (picks.length === before) break // every category is exhausted
    }

    return {
      city: place.city,
      nation: place.nation,
      totalCount: inPlace.length,
      services: picks,
      constituencies: [...perConstituency.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_CONSTITUENCIES)
        .map(({ name, slug }) => ({ name, slug })),
    }
  }).filter((group) => group.services.length > 0)
}
