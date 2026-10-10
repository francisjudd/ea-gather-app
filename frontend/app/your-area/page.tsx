import type { Metadata } from 'next'
import YourArea from './YourArea'

export const metadata: Metadata = {
  title: 'Your area | More Than Sunday',
  description: 'See the churches and social action projects in your constituency, and use the picture they build to write to your MP.',
}

export default function YourAreaPage() {
  return <YourArea />
}
