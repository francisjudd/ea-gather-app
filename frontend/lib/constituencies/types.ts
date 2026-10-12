// Types for the constituency pages, mirroring the FastAPI backend responses
// (/openapi/areas and /openapi/areas/{slug}). These match lib/api/schema.d.ts,
// which is generated from the backend's OpenAPI schema.

export type ConstituencySummary = {
  slug: string
  name: string
  code: string | null
  churchCount: number
  serviceCount: number
}

// A community programme linked to a church (from the church_services table).
export type ConstituencyProgramme = {
  name: string
  category: string
}

export type ConstituencyChurch = {
  id: string
  name: string
  denomination: string | null
  address: string | null
  postcode: string | null
  lat: number | null
  lng: number | null
  website: string | null
  phone: string | null
  programmes: ConstituencyProgramme[]
}

export type ConstituencyService = {
  id: string
  category: string
  name: string
  address: string | null
  postcode: string | null
  lat: number | null
  lng: number | null
  website: string | null
  phone: string | null
}

export type ConstituencyMp = {
  name: string
  party: string | null
  email: string | null
}

export type ConstituencyDetail = ConstituencySummary & {
  mp: ConstituencyMp | null
  churches: ConstituencyChurch[]
  services: ConstituencyService[]
  servicesByCategory: Record<string, number>
}
