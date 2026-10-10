'use client'

import { useMemo, useState, type FormEvent } from 'react'
import FullNav from '../../components/FullNavigation'
import BrandLockup from '../../components/BrandLockup'
import MapView from './MapView'
import ChurchProfileCard from './ChurchProfileCard'
import { initiativeTypes } from '../../lib/initiatives'
import { dayKeys, dayShortLabels, parseChurchHours, type DayKey } from '../../lib/churchHours'
import { distanceMiles, formatDistance, type LatLng } from '../../lib/geo'
import styles from './churches.module.css'
import { PinIcon, SearchIcon } from './icons'

type Church = {
  id: string
  name: string
  address: string
  place: string
  lat: number
  lng: number
  denomination: string
  operatingHours: string
  verified: boolean
  initiatives: string[]
}

type ScoredChurch = Church & { distanceMiles?: number }

const DEFAULT_RADIUS_MILES = 15

const churches: Church[] = [
  {
    id: 'audacious-salford',
    name: '!Audacious Church',
    address: '!Audacious Church, Trinity Way, Salford, M3 7BB',
    place: 'Salford',
    lat: 53.483,
    lng: -2.292,
    denomination: 'Independent',
    operatingHours: 'Sun 9am, 11am & 6pm',
    verified: true,
    initiatives: ['food-bank', 'warm-space', 'youth', 'community-groups', 'eco-church'],
  },
  {
    id: 'audacious-cardiff',
    name: '!Audacious Church - Cardiff',
    address: 'Majestic Hotel, Bute Terrace, Cardiff, CF10 2FL',
    place: 'Cardiff',
    lat: 51.475,
    lng: -3.166,
    denomination: 'Independent',
    operatingHours: 'Sun 10am & 6pm',
    verified: true,
    initiatives: ['food-bank', 'family-groups', 'youth', 'holiday-clubs'],
  },
  {
    id: 'audacious-chester',
    name: '!Audacious Church - Chester',
    address: '4 Sovereign Way, Chester, CH1 4QN',
    place: 'Chester',
    lat: 53.19,
    lng: -2.891,
    denomination: 'Independent',
    operatingHours: 'Sun 10:30am',
    verified: false,
    initiatives: ['warm-space', 'debt-advice', 'community-groups'],
  },
  {
    id: 'audacious-bury',
    name: '!Audacious Church - North Manchester',
    address: 'Vue Cinema Bury, The Rock, Bury, Lancashire, BL9 0YB',
    place: 'Bury',
    lat: 53.593,
    lng: -2.298,
    denomination: 'Independent',
    operatingHours: 'Sun 10am & 5pm',
    verified: true,
    initiatives: ['food-bank', 'clothing-bank', 'youth', 'street-pastors'],
  },
  {
    id: 'audacious-sheffield',
    name: '!Audacious Church - Sheffield',
    address: 'Sandman Signature Sheffield Quays Hotel, Victoria Quays, Sheffield, S4 7YA',
    place: 'Sheffield',
    lat: 53.384,
    lng: -1.47,
    denomination: 'Independent',
    operatingHours: 'Sun 10:30am & 6pm',
    verified: false,
    initiatives: ['food-bank', 'warm-space', 'mental-health', 'recovery'],
  },
  {
    id: 'audacious-stockport',
    name: '!Audacious Church - South Manchester',
    address: 'Seashell Trust, Stanley Road, Cheadle, Stockport, SK8 6RQ',
    place: 'Stockport',
    lat: 53.395,
    lng: -2.213,
    denomination: 'Independent',
    operatingHours: 'Sun 10am',
    verified: true,
    initiatives: ['family-groups', 'schools', 'older-people', 'eco-church'],
  },
  {
    id: 'three-counties',
    name: '3 Counties Vineyard',
    address: 'Haslemere Locality Office, Linchmere Road, Haslemere, Surrey, GU27 3QW',
    place: 'Haslemere',
    lat: 51.088,
    lng: -0.708,
    denomination: 'Vineyard',
    operatingHours: 'Sun 10:30am',
    verified: true,
    initiatives: ['community-groups', 'family-groups', 'esol'],
  },
  {
    id: '360-life',
    name: '360 Life Church',
    address: 'Cale Green Life Centre, 71 Adswood Road, Davenport, Stockport, SK3 8HR',
    place: 'Stockport',
    lat: 53.4,
    lng: -2.16,
    denomination: 'Independent',
    operatingHours: 'Sun 10:30am',
    verified: false,
    initiatives: ['food-bank', 'debt-advice', 'youth', 'holiday-clubs'],
  },
  {
    id: '3c-community',
    name: '3c Community Church',
    address: 'Stockport, Greater Manchester',
    place: 'Stockport',
    lat: 53.41,
    lng: -2.157,
    denomination: 'Independent',
    operatingHours: 'Sun 10am',
    verified: false,
    initiatives: ['warm-space', 'community-groups', 'older-people'],
  },
  {
    id: 'abbey-chapel',
    name: 'Abbey Chapel',
    address: 'United Kingdom',
    place: 'United Kingdom',
    lat: 52.5,
    lng: -1.5,
    denomination: 'Independent',
    operatingHours: 'Sun 11am',
    verified: true,
    initiatives: ['food-bank', 'clothing-bank', 'prison', 'street-pastors'],
  },
]

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// --- Local geocoding for the sample directory -------------------------------
// The preview has no geocoder API, so we resolve a searched postcode / place
// to a coordinate using the sample entries themselves. This keeps "near me"
// and "near a postcode" working without an external API.

const FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i
const POSTCODE_AREA = /^[A-Z]{1,2}\d[A-Z]?$/i
const OUTWARD_CODE = /([A-Z]{1,2}\d[A-Z]?)\s?\d[A-Z]{2}/i

function outwardCode(address: string): string {
  return address.match(OUTWARD_CODE)?.[1]?.toLocaleUpperCase('en-GB') ?? ''
}

function average(center: LatLng, points: Church[]): LatLng {
  const total = points.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: total.lat / points.length, lng: total.lng / points.length }
}

/**
 * Resolve a loose query (full postcode, postcode area, or place name) to a
 * coordinate so the directory can return distance-sorted results. Returns null
 * when the query is not a location.
 */
function resolveCenter(query: string): LatLng | null {
  const normalized = query.trim().toLocaleUpperCase('en-GB')
  if (!normalized) return null

  // Full postcode, e.g. "M3 7BB" -> use that church's coordinates.
  const full = normalized.match(FULL_POSTCODE)
  if (full) {
    const exact = churches.find((church) => church.address.toLocaleUpperCase('en-GB').includes(full[0]))
    if (exact) return { lat: exact.lat, lng: exact.lng }
  }

  // Postcode area, e.g. "M3" -> average of churches in that area.
  const area = normalized.match(POSTCODE_AREA)
  if (area) {
    const inArea = churches.filter((church) => outwardCode(church.address).startsWith(area[1]))
    if (inArea.length > 0) return average({ lat: 0, lng: 0 }, inArea)
  }

  // Place name, e.g. "Stockport" -> average of churches there.
  const inPlace = churches.filter((church) => church.place.toLocaleUpperCase('en-GB') === normalized)
  if (inPlace.length > 0) return average({ lat: 0, lng: 0 }, inPlace)

  return null
}

export default function ChurchFinder() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [letter, setLetter] = useState('All')
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([])
  const [selectedChurch, setSelectedChurch] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [myCoords, setMyCoords] = useState<LatLng | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_MILES)

  const activeCenter = useMemo<LatLng | null>(
    () => myCoords ?? resolveCenter(submittedQuery),
    [myCoords, submittedQuery],
  )

  const filteredChurches = useMemo<ScoredChurch[]>(() => {
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase('en-GB')
    const daySet = new Set(selectedDays)
    const initiativeSet = selectedInitiatives

    const base: Church[] = churches.filter((church) => {
      const matchesQuery = !normalizedQuery
        || `${church.name} ${church.address} ${church.place}`.toLocaleLowerCase('en-GB').includes(normalizedQuery)
      const initial = church.name.match(/[a-z]/i)?.[0]?.toLocaleUpperCase('en-GB')
      const matchesLetter = letter === 'All' || initial === letter
      const matchesInitiatives = initiativeSet.length === 0
        || initiativeSet.every((initiative) => church.initiatives.includes(initiative))
      const matchesDays = daySet.size === 0
        || parseChurchHours(church.operatingHours).some((entry) => daySet.has(entry.day))
      return matchesQuery && matchesLetter && matchesInitiatives && matchesDays
    })

    // When a search center is known (browser location or a postcode/place query)
    // return nearest-first results within the chosen radius.
    if (activeCenter) {
      return base
        .map((church) => ({
          ...church,
          distanceMiles: distanceMiles(activeCenter, { lat: church.lat, lng: church.lng }),
        }))
        .filter((church) => (church.distanceMiles ?? 0) <= radius)
        .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    }

    return base
  }, [letter, selectedInitiatives, selectedDays, submittedQuery, activeCenter, radius])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
    setMyCoords(null)
    setSelectedChurch('')
    setLocationMessage('')
    if (view === 'map' && resolveCenter(query)) setView('list')
  }

  function viewAllChurches() {
    setQuery('')
    setSubmittedQuery('')
    setLetter('All')
    setSelectedInitiatives([])
    setSelectedDays([])
    setMyCoords(null)
    setSelectedChurch('')
    setView('list')
  }

  function toggleInitiative(id: string) {
    setSelectedInitiatives((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
    setSelectedChurch('')
  }

  function toggleDay(day: DayKey) {
    setSelectedDays((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day],
    )
    setSelectedChurch('')
  }

  function useCurrentLocation() {
    setLocationMessage('')
    if (!navigator.geolocation) {
      setLocationMessage('Location services are not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setSubmittedQuery('')
        setQuery('')
        setSelectedChurch('')
        setView('list')
        setLocationMessage(`Showing churches within ${radius} miles of your location, nearest first.`)
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access was not allowed. You can still search by church name, postcode or place.'
          : 'We could not detect your location. You can still search by church name, postcode or place.'
        setLocationMessage(message)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  function clearLocation() {
    setMyCoords(null)
    setSubmittedQuery('')
    setQuery('')
    setSelectedChurch('')
    setLocationMessage('')
  }

  function chooseLetter(nextLetter: string) {
    setLetter(nextLetter)
    setSelectedChurch('')
    setView('list')
  }

  return (
    <div className={styles.page}>
      <FullNav />

      <main className={styles.main}>
        <section className={styles.searchSection} aria-labelledby="page-title">
          <p className={styles.eyebrow}>EVANGELICAL ALLIANCE DIRECTORY</p>
          <h1 id="page-title">Find a church</h1>

          <form className={styles.searchForm} onSubmit={submitSearch} role="search">
            <label className={styles.visuallyHidden} htmlFor="church-search">
              Search by church name, postcode or place
            </label>
            <input
              id="church-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by church name, postcode or place..."
            />
            <button className={styles.searchButton} type="submit">
              <SearchIcon />
              <span>Search</span>
            </button>
          </form>

          <div className={styles.searchLinks}>
            <button className={styles.locationButton} type="button" onClick={useCurrentLocation}>
              <PinIcon />
              <span>Use my current location</span>
            </button>
            <button className={styles.viewAllLink} type="button" onClick={viewAllChurches}>
              Or view all Evangelical Alliance member churches
            </button>
          </div>

          {activeCenter && (
            <div className={styles.locationBar} role="group" aria-label="Location search options">
              <span className={styles.locationBarLabel}>
                <PinIcon />
                {myCoords ? 'Near you' : `Near ${submittedQuery.toLowerCase()}`}{': '}
              </span>
              <label className={styles.radiusField} htmlFor="radius-select">
                <span className={styles.visuallyHidden}>Search radius</span>
                <select
                  id="radius-select"
                  className={styles.radiusSelect}
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                >
                  <option value="5">within 5 miles</option>
                  <option value="10">within 10 miles</option>
                  <option value="15">within 15 miles</option>
                  <option value="25">within 25 miles</option>
                  <option value="50">within 50 miles</option>
                </select>
              </label>
              <span className={styles.locationBarCount}>
                {filteredChurches.length} found
              </span>
              {myCoords && (
                <button className={styles.locationClear} type="button" onClick={clearLocation}>
                  Clear location
                </button>
              )}
            </div>
          )}
          {locationMessage && <p className={styles.locationMessage} role="status">{locationMessage}</p>}

          <div className={styles.facetPanel}>
            <div className={styles.facetHeader}>
              <span className={styles.facetLabel}>What they do:</span>
              {selectedInitiatives.length > 0 && (
                <button className={styles.facetClear} type="button" onClick={() => setSelectedInitiatives([])}>
                  Clear filters
                </button>
              )}
            </div>
            <div className={styles.facetChips} role="group" aria-label="Filter churches by community initiative">
              {initiativeTypes.map((initiative) => {
                const active = selectedInitiatives.includes(initiative.id)
                return (
                  <button
                    key={initiative.id}
                    className={`${styles.facetChip} ${active ? styles.facetChipActive : ''}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInitiative(initiative.id)}
                  >
                    {initiative.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.facetPanel}>
            <div className={styles.facetHeader}>
              <span className={styles.facetLabel}>When they&rsquo;re open:</span>
              {selectedDays.length > 0 && (
                <button className={styles.facetClear} type="button" onClick={() => setSelectedDays([])}>
                  Clear filters
                </button>
              )}
            </div>
            <div className={styles.facetChips} role="group" aria-label="Filter churches by opening day">
              {dayKeys.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button
                    key={day}
                    className={`${styles.facetChip} ${active ? styles.facetChipActive : ''}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day)}
                  >
                    {dayShortLabels[day]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.viewToolbar}>
            <span className={styles.viewLabel}>View:</span>
            <div className={styles.viewSwitch} role="group" aria-label="Display churches as a map or a list">
              <button
                className={view === 'map' ? styles.viewActive : ''}
                type="button"
                aria-pressed={view === 'map'}
                onClick={() => setView('map')}
              >
                <PinIcon />
                Map
              </button>
              <button
                className={view === 'list' ? styles.viewActive : ''}
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <path d="M7 5h10M7 10h10M7 15h10" />
                  <circle cx="3" cy="5" r=".8" />
                  <circle cx="3" cy="10" r=".8" />
                  <circle cx="3" cy="15" r=".8" />
                </svg>
                List
              </button>
            </div>
            <span className={styles.resultCount} aria-live="polite">
              {filteredChurches.length} sample {filteredChurches.length === 1 ? 'church' : 'churches'}
            </span>
          </div>
        </section>

        {view === 'map' ? (
          <>
            <MapView
              churches={filteredChurches}
              selectedChurch={selectedChurch}
              onSelectChurch={setSelectedChurch}
            />
            {selectedChurch && (() => {
              const cardChurch = churches.find((church) => church.id === selectedChurch)
              if (!cardChurch) return null
              const distanceMiles = filteredChurches.find((church) => church.id === selectedChurch)?.distanceMiles
              return (
                <div className={styles.profilePanel}>
                  <ChurchProfileCard church={{ ...cardChurch, distanceMiles }} />
                </div>
              )
            })()}
          </>
        ) : (
          <section className={styles.listPanel} aria-label="Church directory list">
            <div className={styles.alphabet} role="group" aria-label="Filter churches by first letter">
              <button
                className={letter === 'All' ? styles.alphabetActive : ''}
                type="button"
                aria-pressed={letter === 'All'}
                onClick={() => chooseLetter('All')}
              >
                All
              </button>
              {alphabet.map((item) => (
                <button
                  key={item}
                  className={letter === item ? styles.alphabetActive : ''}
                  type="button"
                  aria-pressed={letter === item}
                  onClick={() => chooseLetter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <ul className={styles.churchList}>
              {filteredChurches.map((church) => (
                <li key={church.id}>
                  <button
                    className={styles.churchRow}
                    type="button"
                    aria-expanded={selectedChurch === church.id}
                    onClick={() => setSelectedChurch(selectedChurch === church.id ? '' : church.id)}
                  >
                    <span>
                      <strong>{church.name}</strong>
                      <span className={styles.address}>
                        <PinIcon />
                        {church.address}
                      </span>
                    </span>
                    <span className={styles.rowMeta}>
                      {church.distanceMiles != null && (
                        <span className={styles.rowDistance} aria-label={`${church.distanceMiles.toFixed(1)} miles away`}>
                          {formatDistance(church.distanceMiles)}
                        </span>
                      )}
                      <span className={styles.rowChevron} aria-hidden="true">›</span>
                    </span>
                  </button>
                  {selectedChurch === church.id && (
                    <div className={styles.profileInline}>
                      <ChurchProfileCard church={church} />
                    </div>
                  )}
                </li>
              ))}
              {filteredChurches.length === 0 && (
                <li className={styles.emptyList}>
                  No sample churches match your search. Try another name, postcode or place, widen the
                  radius, or clear the opening-day and initiative filters.
                </li>
              )}
            </ul>
            <p className={styles.previewNote}>
              This preview uses a small sample of directory entries; it is not the full church directory.
            </p>
          </section>
        )}

        {view === 'map' && (
          <p className={styles.mapNote}>
            The addresses shown on this map are where the churches meet, and not necessarily the
            correspondence address. Please contact the individual churches for the correspondence address.
          </p>
        )}

        <aside className={styles.aboutNote}>
          <p>
            The Evangelical Alliance is a membership organisation made up of churches and organisations from
            different denominational and independent church backgrounds. Our members are united in subscribing
            to our <a href="https://www.eauk.org/about-us/how-we-work/basis-of-faith">basis of faith</a> and
            our <a href="https://www.eauk.org/about-us/how-we-work/relationship-commitments">relationship commitments</a>.
          </p>
          <p>
            We encourage our members to operate with the highest integrity and to ensure that appropriate
            governance and safeguarding policies and practices are in place. This responsibility lies with
            the trustees and leadership of each member church or organisation.
          </p>
        </aside>
      </main>

      <footer className={styles.footer}>
        <BrandLockup size="sm" />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
