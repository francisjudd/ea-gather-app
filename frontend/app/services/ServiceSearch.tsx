'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Fuse from 'fuse.js'
import FullNav from '../../components/FullNavigation'
import BrandLockup from '../../components/BrandLockup'
import { distanceMiles, formatDistance, type LatLng } from '../../lib/geo'
import { slugifyConstituency } from '@/lib/constituencies/slug'
import type { ConstituencyDetail, ConstituencyService, ConstituencySummary } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import c from '../constituencies/constituency.module.css'
import styles from './services.module.css'

const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i
const MAX_SUGGESTIONS = 6

type ResultService = ConstituencyService & { distance: number | null }
type Results = {
  constituency: ConstituencySummary
  services: ResultService[]
  postcode: string | null
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

export default function ServiceSearch({ constituencies }: { constituencies: ConstituencySummary[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const fuse = useMemo(
    () => new Fuse(constituencies, { keys: ['name'], threshold: 0.3, ignoreLocation: true }),
    [constituencies],
  )
  const looksLikePostcode = FULL_POSTCODE.test(query.trim())
  const suggestions = useMemo(
    () => (query.trim().length >= 2 && !looksLikePostcode ? fuse.search(query.trim(), { limit: MAX_SUGGESTIONS }).map((hit) => hit.item) : []),
    [fuse, query, looksLikePostcode],
  )

  async function showConstituency(summary: ConstituencySummary, origin?: { coords: LatLng; postcode: string }) {
    const response = await fetch(`/api/constituencies/${summary.slug}`)
    if (!response.ok) throw new Error('constituency')
    const detail: ConstituencyDetail = await response.json()

    const services: ResultService[] = detail.services.map((service) => ({
      ...service,
      distance:
        origin && service.lat != null && service.lng != null
          ? distanceMiles(origin.coords, { lat: service.lat, lng: service.lng })
          : null,
    }))
    if (origin) services.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    setResults({ constituency: summary, services, postcode: origin?.postcode ?? null })
    // Wait for the results to render, then scroll to them.
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function search(event?: FormEvent) {
    event?.preventDefault()
    const text = query.trim()
    setOpen(false)
    setMessage('')
    if (!text) return
    setLoading(true)
    try {
      if (looksLikePostcode) {
        const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(text.replace(/\s/g, ''))}`)
        if (!response.ok) {
          setMessage('We couldn’t find that postcode. Check it and try again, or search by constituency name.')
          return
        }
        const { result } = await response.json()
        const wanted: string = result.parliamentary_constituency ?? ''
        const summary =
          constituencies.find((item) => item.slug === slugifyConstituency(wanted)) ?? fuse.search(wanted)[0]?.item
        if (!summary) {
          setMessage('We couldn’t match that postcode to a constituency.')
          return
        }
        await showConstituency(summary, {
          coords: { lat: result.latitude, lng: result.longitude },
          postcode: text.toUpperCase().replace(/\s+/g, ' '),
        })
      } else {
        const match = fuse.search(text, { limit: 1 })[0]?.item
        if (!match) {
          setMessage('No constituency matches that. Try a full postcode, such as SW15 2DR, or another name.')
          return
        }
        await showConstituency(match)
      }
    } catch {
      setMessage('Something went wrong while searching. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function chooseSuggestion(item: ConstituencySummary) {
    setQuery(item.name)
    setOpen(false)
    setMessage('')
    setLoading(true)
    try {
      await showConstituency(item)
    } catch {
      setMessage('Something went wrong while searching. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={churches.page}>
      <FullNav />

      <section className={`ea-hero on-dark ${c.hero}`} aria-labelledby="page-title">
        <div className={c.container}>
          <nav aria-label="Breadcrumb" className={c.breadcrumb}>
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Community services</li>
            </ol>
          </nav>

          <div className={styles.heroBody}>
            <p className={c.eyebrow}>Community services</p>
            <h1 id="page-title" className={styles.heading}>Find community services near you</h1>
            <p className={styles.lede}>
              Food banks, warm spaces, debt help and more. Search by postcode or constituency.
            </p>

            <form className={styles.searchBox} role="search" onSubmit={search}>
              <label className={churches.visuallyHidden} htmlFor="service-search">
                Postcode or constituency
              </label>
              <input
                id="service-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                placeholder="Enter a postcode or constituency"
                role="combobox"
                aria-expanded={open && suggestions.length > 0}
                aria-controls="service-suggestions"
                aria-autocomplete="list"
              />
              <button type="submit" disabled={loading} aria-label="Search">
                <SearchIcon />
              </button>

              {open && suggestions.length > 0 && (
                <ul id="service-suggestions" className={styles.suggestions} role="listbox">
                  {suggestions.map((item) => (
                    <li key={item.slug} role="option" aria-selected={false}>
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(item)}>
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            {message && <p className={styles.message} role="alert">{message}</p>}
            {loading && <p className={styles.message} role="status">Searching…</p>}
          </div>
        </div>
      </section>

      <main className={`${c.container} ${styles.resultsMain}`}>
        {results && (
          <section ref={resultsRef} className={styles.results} aria-labelledby="results-title">
            <h2 id="results-title" className={styles.resultsTitle}>
              {results.services.length === 0
                ? `No community services listed in ${results.constituency.name} yet`
                : `${results.services.length} ${results.services.length === 1 ? 'service' : 'services'} in ${results.constituency.name}`}
            </h2>
            {results.postcode && results.services.length > 0 && (
              <p className={styles.resultsNote}>Nearest to {results.postcode} first.</p>
            )}

            <ul className={styles.grid}>
              {results.services.map((service) => (
                <li key={service.id} className={styles.card}>
                  <span className={styles.cardTop}>
                    <span className={styles.pill}>{service.category}</span>
                    {service.distance != null && <span className={styles.distance}>{formatDistance(service.distance)}</span>}
                  </span>
                  <strong className={styles.cardName}>{service.name}</strong>
                  <span className={styles.cardAddress}>
                    <PinIcon />
                    <span>{service.address ?? service.postcode ?? 'Address not listed'}</span>
                  </span>
                  {(service.website || service.phone) && (
                    <span className={styles.cardLinks}>
                      {service.website && <a href={service.website} rel="noopener noreferrer" target="_blank">Website</a>}
                      {service.phone && <a href={`tel:${service.phone.replace(/\s/g, '')}`}>{service.phone}</a>}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className={styles.resultsNote}>
              See the churches too: <Link href={`/constituencies/${results.constituency.slug}`}>{results.constituency.name}</Link>
            </p>
          </section>
        )}
      </main>

      <footer className={churches.footer}>
        <BrandLockup size="sm" />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
