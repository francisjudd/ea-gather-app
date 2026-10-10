import type { Metadata } from 'next'
import { constituencies } from '@/lib/constituencies/source'
import ConstituencyIndex from './ConstituencyIndex'

export const metadata: Metadata = {
  title: 'Constituencies | More Than Sunday',
  description: 'Find the churches and community services in your constituency.',
}

export default async function ConstituenciesPage() {
  return <ConstituencyIndex constituencies={await constituencies.list()} />
}
