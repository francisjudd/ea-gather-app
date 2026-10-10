// Geolocation helpers for the public church directory (PUB-01).

export type LatLng = {
  lat: number
  lng: number
}

/**
 * Great-circle distance between two points in miles (Haversine).
 */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const earthRadiusMiles = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(s))
}

/**
 * Format a distance in miles, keeping 1 decimal place under 10 miles.
 */
export function formatDistance(miles: number): string {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`
}
