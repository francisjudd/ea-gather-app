import type { Metadata } from 'next'
import SubmitChurchForm from './SubmitChurchForm'

export const metadata: Metadata = {
  title: 'Submit a church | Evangelical Alliance',
  description: 'Tell us about a church and the community initiatives it runs so it can be added to the directory.',
}

export default function SubmitChurchPage() {
  return <SubmitChurchForm />
}
