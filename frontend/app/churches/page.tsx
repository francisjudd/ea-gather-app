import type { Metadata } from 'next'
import ChurchFinder from './ChurchFinder'

export const metadata: Metadata = {
  title: 'Find a church | Evangelical Alliance',
  description: 'Search the Evangelical Alliance church directory by church name, postcode or place.',
}

export default function ChurchesPage() {
  return <ChurchFinder />
}
