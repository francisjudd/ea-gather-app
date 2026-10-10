import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { constituencies } from '@/lib/constituencies/source'
import ConstituencyView from '../ConstituencyView'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return (await constituencies.list()).map(({ slug }) => ({ slug }))
}

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
