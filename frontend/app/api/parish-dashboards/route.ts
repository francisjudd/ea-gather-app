import { NextRequest, NextResponse } from 'next/server'

// The Church of England publishes a 1-page parish summary of national census and
// deprivation data, mapped onto CofE parish boundaries. The dashboards are PDFs
// hosted on S3 behind short-lived signed URLs, so we proxy the search through a
// server-side route to (a) avoid browser CORS restrictions and (b) return fresh
// links on every request.
const DASHBOARDS_URL = 'https://parishreturns.churchofengland.org/census-dashboards/'

type ParishDashboard = {
  diocese: string
  deanery: string
  parish: string
  parishCode: string
  pdfUrl: string
}

type Diocese = {
  id: string
  name: string
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractDioceses(html: string): Diocese[] {
  const options = html.matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)
  const dioceses: Diocese[] = []
  for (const match of options) {
    const name = decodeEntities(match[2]).replace(/\s*\(\d+\)\s*$/, '').trim()
    if (name) dioceses.push({ id: match[1], name })
  }
  return dioceses
}

function extractRows(html: string): ParishDashboard[] {
  const rows = html.matchAll(/<tr>\s*<td>\s*([\s\S]*?)\s*<\/td>\s*<td>\s*([\s\S]*?)\s*<\/td>\s*<td>\s*([\s\S]*?)\s*<\/td>\s*<td>\s*<a href="([^"]+)"[\s\S]*?<\/a>\s*<\/td>\s*<\/tr>/g)
  const results: ParishDashboard[] = []
  for (const match of rows) {
    const diocese = decodeEntities(match[1]).trim()
    const deanery = decodeEntities(match[2]).trim()
    const parish = decodeEntities(match[3]).trim()
    const pdfUrl = decodeEntities(match[4]).trim()
    if (!diocese || !parish || !pdfUrl) continue

    // Parish cells look like "Manchester (240001)" — split the code out so the
    // UI can display it separately.
    const codeMatch = parish.match(/\((\d+)\)\s*$/)
    const parishCode = codeMatch ? codeMatch[1] : ''
    const parishName = codeMatch ? parish.replace(/\s*\(\d+\)\s*$/, '').trim() : parish

    results.push({ diocese, deanery, parish: parishName, parishCode, pdfUrl })
  }
  return results
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const diocese = searchParams.get('diocese') ?? ''
  const search = searchParams.get('search') ?? ''

  const params = new URLSearchParams()
  if (diocese) params.set('diocese', diocese)
  if (search) params.set('search', search)

  const url = params.toString() ? `${DASHBOARDS_URL}?${params.toString()}` : DASHBOARDS_URL

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EA-Gathering/1.0)',
        Accept: 'text/html',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `The Church of England dashboards service returned ${response.status}.` },
        { status: 502 },
      )
    }

    const html = await response.text()
    const dioceses = extractDioceses(html)
    const results = extractRows(html)

    return NextResponse.json({ dioceses, results })
  } catch {
    return NextResponse.json(
      { error: 'We could not reach the Church of England dashboards service. Please try again shortly.' },
      { status: 502 },
    )
  }
}
