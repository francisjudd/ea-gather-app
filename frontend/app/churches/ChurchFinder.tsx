'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import FullNav from '../../components/FullNavigation'
import BrandLockup from '../../components/BrandLockup'
import MapView from './MapView'
import ChurchProfileCard from './ChurchProfileCard'
import { initiativeTypes } from '../../lib/initiatives'
import { api, type Church } from '../../lib/api/client'
import { dayKeys, dayShortLabels, parseChurchHours, type DayKey } from '../../lib/churchHours'
import { distanceMiles, formatDistance, type LatLng } from '../../lib/geo'
import styles from './churches.module.css'
import { PinIcon, SearchIcon } from './icons'

type ScoredChurch = Church & { distanceMiles?: number | null }

const DEFAULT_RADIUS_MILES = 15

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
  const [churches, setChurches] = useState<Church[]>([])

  // Load the directory from the API. The backend returns distance-sorted results
  // when lat/lng are supplied, so we refetch when the search center changes.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const params: Parameters<typeof api.listChurches>[0] = { limit: 5000 }
        if (myCoords) {
          params.lat = myCoords.lat
          params.lng = myCoords.lng
          params.radius = radius
        }
        const data = await api.listChurches(params)
        if (!cancelled) setChurches(data)
      } catch {
        if (!cancelled) setChurches([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [myCoords, radius])

  const activeCenter = useMemo<LatLng | null>(() => myCoords, [myCoords])

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

    // When a search center is known (browser location) return nearest-first
    // results within the chosen radius.
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
  }, [letter, selectedInitiatives, selectedDays, submittedQuery, activeCenter, radius, churches])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
    setMyCoords(null)
    setSelectedChurch('')
    setLocationMessage('')
    if (view === 'map') setView('list')
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
              {filteredChurches.length} {filteredChurches.length === 1 ? 'church' : 'churches'}
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
                  No churches match your search. Try another name, postcode or place, widen the
                  radius, or clear the opening-day and initiative filters.
                </li>
              )}
            </ul>
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
