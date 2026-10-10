// INTERIM types for the constituency pages.
// These mirror what we expect the FastAPI backend to return, but the API hasn't
// landed yet (backend/openapi.yaml has no paths). Once it does, replace these with
// types derived from lib/api/schema.d.ts and adjust source.ts, the only file that
// knows where the data comes from.

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
