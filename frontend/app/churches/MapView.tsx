'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import styles from './churches.module.css'

type Church = {
  id: string
  name: string
  address: string
  place: string
  lat: number
  lng: number
  /** When set, the pin is a plain coloured circle (navy = church, teal = community service). */
  kind?: 'church' | 'service'
}

const PIN_COLOURS = { church: '#24305F', service: '#449AAE' } as const

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

let optionsSet = false

export default function MapView({
  churches,
  selectedChurch,
  onSelectChurch,
  canvasClassName,
  focusSelected = false,
}: {
  churches: Church[]
  selectedChurch: string
  onSelectChurch: (id: string) => void
  canvasClassName?: string
  /** Pan/zoom to the selected church's pin instead of refitting all pins. Default off. */
  focusSelected?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapsLibRef = useRef<google.maps.MapsLibrary | null>(null)
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null)
  const coreLibRef = useRef<google.maps.CoreLibrary | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [error, setError] = useState('')
  // When focusing the selection we must not refit all pins on every selection change.
  const refitKey = focusSelected ? '' : selectedChurch

  const renderMarkers = useCallback(
    (
      maps: google.maps.MapsLibrary,
      marker: google.maps.MarkerLibrary,
      core: google.maps.CoreLibrary,
      map: google.maps.Map,
      items: Church[],
    ) => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      markerByIdRef.current = new Map()

      const bounds = new core.LatLngBounds()
      items.forEach((church) => {
        const position = { lat: church.lat, lng: church.lng }
        const markerInstance = new marker.Marker({
          position,
          map,
          title: church.name,
          ...(church.kind && {
            icon: {
              path: core.SymbolPath.CIRCLE,
              fillColor: PIN_COLOURS[church.kind],
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 9,
            },
          }),
        })
        markerInstance.addListener('click', () => {
          onSelectChurch(church.id)
        })
        markersRef.current.push(markerInstance)
        markerByIdRef.current.set(church.id, markerInstance)
        bounds.extend(position)
      })

      if (items.length > 0) {
        map.fitBounds(bounds)
      }
    },
    [onSelectChurch],
  )

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    if (!optionsSet) {
      setOptions({ key: apiKey, v: 'weekly' })
      optionsSet = true
    }

    Promise.all([importLibrary('maps'), importLibrary('marker'), importLibrary('core')])
      .then(([maps, marker, core]) => {
        if (cancelled || !containerRef.current) return
        mapsLibRef.current = maps
        markerLibRef.current = marker
        coreLibRef.current = core
        const map = new maps.Map(containerRef.current, {
          center: { lat: 54.0, lng: -2.5 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
        })
        mapRef.current = map
        renderMarkers(maps, marker, core, map, churches)
      })
      .catch(() => {
        if (!cancelled) setError('Google Maps could not be loaded. Check your API key and billing.')
      })

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      mapRef.current = null
      mapsLibRef.current = null
      markerLibRef.current = null
      coreLibRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const maps = mapsLibRef.current
    const marker = markerLibRef.current
    const core = coreLibRef.current
    if (!map || !maps || !marker || !core) return
    renderMarkers(maps, marker, core, map, churches)
  }, [churches, refitKey, renderMarkers])

  useEffect(() => {
    if (!focusSelected) return
    const map = mapRef.current
    const marker = markerByIdRef.current.get(selectedChurch)
    const position = marker?.getPosition()
    if (!map || !marker || !position) return
    map.panTo(position)
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14)
    marker.setAnimation(google.maps.Animation.BOUNCE)
    const timeout = window.setTimeout(() => marker.setAnimation(null), 1400)
    return () => window.clearTimeout(timeout)
  }, [focusSelected, selectedChurch])

  if (!apiKey) {
    return (
      <div className={styles.mapPanel}>
        <div className={`${styles.mapCanvas} ${canvasClassName ?? ''}`} />
        <div className={styles.mapError}>
          Google Maps is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mapPanel}>
      <div ref={containerRef} className={`${styles.mapCanvas} ${canvasClassName ?? ''}`} />
      {error && <div className={styles.mapError}>{error}</div>}
    </div>
  )
}
