import { NextResponse } from 'next/server'
import { constituencies } from '@/lib/constituencies/source'

// Lets client components load one constituency (with its services) through the same
// repository the pages use. Swap the repository to the FastAPI backend and this follows.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const detail = await constituencies.get((await params).slug)
  if (!detail) return NextResponse.json({ error: 'Constituency not found' }, { status: 404 })
  return NextResponse.json(detail)
}
