import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { constituencies } from '@/lib/constituencies/source'
import ConstituencyView from '../ConstituencyView'

type Params = { params: Promise<{ slug: string }> }

// Data is fetched at runtime from the API, so pages are rendered on demand
// rather than pre-generated at build time.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const detail = await constituencies.get((await params).slug)
  if (!detail) return {}
  return {
    title: `${detail.name} | More Than Sunday`,
    description: `${detail.churchCount} churches and ${detail.serviceCount} community services in ${detail.name}.`,
  }
}

export default async function ConstituencyPage({ params }: Params) {
  const detail = await constituencies.get((await params).slug)
  if (!detail) notFound()
  return <ConstituencyView detail={detail} />
}
