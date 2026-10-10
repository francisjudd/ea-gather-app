import type { Metadata } from 'next'
import DemandSide from './DemandSide'

export const metadata: Metadata = {
  title: 'The demand side | Evangelical Alliance',
  description: 'Explore parish-level census and deprivation dashboards to understand the needs in your community.',
}

export default function DemandPage() {
  return <DemandSide />
}
