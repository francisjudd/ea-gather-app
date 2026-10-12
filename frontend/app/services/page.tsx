import type { Metadata } from 'next'
import { constituencies } from '@/lib/constituencies/source'
import { getFeaturedByCity } from '@/lib/constituencies/featured'
import ServiceSearch from './ServiceSearch'

export const metadata: Metadata = {
  title: 'Find services | More Than Sunday',
  description: 'Search by postcode or constituency to find food banks, warm spaces, debt help and other community services near you.',
}

// Constituency list is fetched at runtime from the API.
export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const [list, featuredGroups] = await Promise.all([constituencies.list(), getFeaturedByCity()])
  return <ServiceSearch constituencies={list} featuredGroups={featuredGroups} />
}
