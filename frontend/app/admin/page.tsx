import type { Metadata } from 'next'
import AdminReview from './AdminReview'

export const metadata: Metadata = {
  title: 'Review submissions | Evangelical Alliance',
  description: 'Review and approve church submissions before they appear in the directory.',
}

export default function AdminPage() {
  return <AdminReview />
}
