import type { Metadata } from 'next'
import { Lato } from 'next/font/google'
import './brand.css'
import './globals.css'

// Proxima Nova is the brand typeface; Lato is the approved fallback (see brand.css).
const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'More Than Sunday | Evangelical Alliance',
  description: 'Let your MP know what your church is doing in your community.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={lato.variable}>
      <body>{children}</body>
    </html>
  )
}
