import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EA Gathering App',
  description: 'Evangelical Alliance Gathering Church Action',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}