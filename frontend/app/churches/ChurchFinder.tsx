'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import MapView from './MapView'
import ChurchProfileCard from './ChurchProfileCard'
import styles from './churches.module.css'

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

const initiativeTypes = [
  { id: 'food-bank', label: 'Food bank or food pantry' },
  { id: 'warm-space', label: 'Warm space / community lounge' },
  { id: 'debt-advice', label: 'Debt advice & financial wellbeing' },
  { id: 'clothing-bank', label: 'Clothing or baby bank' },
  { id: 'family-groups', label: 'Parent / toddler & family groups' },
  { id: 'youth', label: 'Youth clubs or mentoring' },
  { id: 'holiday-clubs', label: 'Holiday clubs / school-holiday meals' },
  { id: 'schools', label: 'Schools work or chaplaincy' },
  { id: 'older-people', label: "Older people's lunches & visits" },
  { id: 'mental-health', label: 'Mental health support groups' },
  { id: 'esol', label: 'ESOL classes / refugee support' },
  { id: 'recovery', label: 'Recovery / addiction support' },
  { id: 'prison', label: 'Prison visiting or chaplaincy' },
  { id: 'street-pastors', label: 'Street pastors or homelessness outreach' },
  { id: 'community-groups', label: 'Hosting community groups in our building' },
  { id: 'eco-church', label: 'Environmental / Eco Church work' },
] as const

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

function ChurchMark() {
  return (
    <span className={styles.brandLockup}>
      <span className={styles.brandName}>evangelical <strong>alliance</strong></span>
      <span className={styles.brandDots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  )
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

export default function ChurchFinder() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [letter, setLetter] = useState('All')
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([])
  const [selectedChurch, setSelectedChurch] = useState('')
  const [locationMessage, setLocationMessage] = useState('')

  const filteredChurches = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase('en-GB')
    return churches.filter((church) => {
      const matchesQuery = !normalizedQuery
        || `${church.name} ${church.address} ${church.place}`.toLocaleLowerCase('en-GB').includes(normalizedQuery)
      const initial = church.name.match(/[a-z]/i)?.[0]?.toLocaleUpperCase('en-GB')
      const matchesLetter = letter === 'All' || initial === letter
      const matchesInitiatives = selectedInitiatives.length === 0
        || selectedInitiatives.every((initiative) => church.initiatives.includes(initiative))
      return matchesQuery && matchesLetter && matchesInitiatives
    })
  }, [letter, selectedInitiatives, submittedQuery])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
    setSelectedChurch('')
    setLocationMessage('')
  }

  function viewAllChurches() {
    setQuery('')
    setSubmittedQuery('')
    setLetter('All')
    setSelectedInitiatives([])
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

  function useCurrentLocation() {
    setLocationMessage('')
    if (!navigator.geolocation) {
      setLocationMessage('Location services are not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => setLocationMessage('Your location was detected. Location-based church results are not available in this preview.'),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access was not allowed. You can still search by church name, postcode or place.'
          : 'We could not detect your location. You can still search by church name, postcode or place.'
        setLocationMessage(message)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  function chooseLetter(nextLetter: string) {
    setLetter(nextLetter)
    setSelectedChurch('')
    setView('list')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brandLink} href="/" aria-label="Evangelical Alliance home">
          <ChurchMark />
        </Link>
        <span className={styles.headerCaption}>Church directory</span>
      </header>

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
            {selectedChurch && (
              <div className={styles.profilePanel}>
                <ChurchProfileCard church={churches.find((church) => church.id === selectedChurch)!} />
              </div>
            )}
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
                    <span className={styles.rowChevron} aria-hidden="true">›</span>
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
                  No sample churches match your search. Try another name, postcode, place or initiative.
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
        <ChurchMark />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
