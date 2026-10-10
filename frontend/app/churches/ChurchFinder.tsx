'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import styles from './churches.module.css'

type Church = {
  id: string
  name: string
  address: string
  place: string
  mapPosition: { left: string; top: string }
}

const churches: Church[] = [
  {
    id: 'audacious-salford',
    name: '!Audacious Church',
    address: '!Audacious Church, Trinity Way, Salford, M3 7BB',
    place: 'Salford',
    mapPosition: { left: '48%', top: '37%' },
  },
  {
    id: 'audacious-cardiff',
    name: '!Audacious Church - Cardiff',
    address: 'Majestic Hotel, Bute Terrace, Cardiff, CF10 2FL',
    place: 'Cardiff',
    mapPosition: { left: '38%', top: '67%' },
  },
  {
    id: 'audacious-chester',
    name: '!Audacious Church - Chester',
    address: '4 Sovereign Way, Chester, CH1 4QN',
    place: 'Chester',
    mapPosition: { left: '42%', top: '45%' },
  },
  {
    id: 'audacious-bury',
    name: '!Audacious Church - North Manchester',
    address: 'Vue Cinema Bury, The Rock, Bury, Lancashire, BL9 0YB',
    place: 'Bury',
    mapPosition: { left: '50%', top: '35%' },
  },
  {
    id: 'audacious-sheffield',
    name: '!Audacious Church - Sheffield',
    address: 'Sandman Signature Sheffield Quays Hotel, Victoria Quays, Sheffield, S4 7YA',
    place: 'Sheffield',
    mapPosition: { left: '57%', top: '43%' },
  },
  {
    id: 'audacious-stockport',
    name: '!Audacious Church - South Manchester',
    address: 'Seashell Trust, Stanley Road, Cheadle, Stockport, SK8 6RQ',
    place: 'Stockport',
    mapPosition: { left: '49%', top: '39%' },
  },
  {
    id: 'three-counties',
    name: '3 Counties Vineyard',
    address: 'Haslemere Locality Office, Linchmere Road, Haslemere, Surrey, GU27 3QW',
    place: 'Haslemere',
    mapPosition: { left: '58%', top: '77%' },
  },
  {
    id: '360-life',
    name: '360 Life Church',
    address: 'Cale Green Life Centre, 71 Adswood Road, Davenport, Stockport, SK3 8HR',
    place: 'Stockport',
    mapPosition: { left: '50%', top: '40%' },
  },
  {
    id: '3c-community',
    name: '3c Community Church',
    address: 'Stockport, Greater Manchester',
    place: 'Stockport',
    mapPosition: { left: '50%', top: '38%' },
  },
  {
    id: 'abbey-chapel',
    name: 'Abbey Chapel',
    address: 'United Kingdom',
    place: 'United Kingdom',
    mapPosition: { left: '55%', top: '51%' },
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
  const [selectedChurch, setSelectedChurch] = useState('')
  const [locationMessage, setLocationMessage] = useState('')

  const filteredChurches = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase('en-GB')
    return churches.filter((church) => {
      const matchesQuery = !normalizedQuery
        || `${church.name} ${church.address} ${church.place}`.toLocaleLowerCase('en-GB').includes(normalizedQuery)
      const initial = church.name.match(/[a-z]/i)?.[0]?.toLocaleUpperCase('en-GB')
      return matchesQuery && (letter === 'All' || initial === letter)
    })
  }, [letter, submittedQuery])

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
    setSelectedChurch('')
    setView('list')
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
          <section className={styles.mapPanel} aria-label="Map preview of example church locations">
            <div className={styles.mapCanvas}>
              <svg className={styles.mapArtwork} viewBox="0 0 1100 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <path className={styles.waterway} d="M-30 356C119 313 172 388 287 350s170-100 287-47 185 55 270 9 146-111 301-74" />
                <path className={styles.roadMajor} d="M63 494C240 426 288 340 442 329s205 65 321 28 209-147 386-159" />
                <path className={styles.roadMajor} d="M246 580c84-114 116-188 117-298S316 113 345-10" />
                <path className={styles.roadMinor} d="M-40 201c205 36 248 155 398 164s174-69 307-77 226 66 474 7" />
                <path className={styles.roadMinor} d="M431 608c-3-126 70-167 93-260s-14-196 70-372" />
                <path className={styles.roadMinor} d="M769 590c-76-118-78-192-29-281s169-120 204-324" />
                <path className={styles.landmass} d="m563 72 25-18 25 6 11 18 24 7 10 25-9 21 10 18-8 26 18 28-8 20 14 21-8 21 14 25-7 28 17 20-8 22 10 28-12 23 6 21-18 24 7 25-20 18-1 30-18 17-2 28-25 23 4 29-23 24-1 30-19 12-8 34-22 5-19-23 3-31-20-13 10-30-18-18 14-23-20-22 15-20-4-28 18-21-7-26 19-22-12-23 20-19-5-27 17-20-15-22 9-23-20-20 8-20-22-23 13-21-10-23 22-16-11-20 24-18-10-17 23-16-5-25 25-19-7-25 31-18 3-21 26-12 8-24 25-9 6-22Z" />
                <path className={styles.landmass} d="m414 202 25-12 21 9 9 21-11 18-19 4-20-13Z" />
                <path className={styles.landmass} d="m359 47 13-14 18 8 2 21-13 13-16-8Z" />
                <path className={styles.landmass} d="m642 427 14-3 8 11-6 13-13-2-7-10Z" />
                <text x="735" y="136">SCOTLAND</text>
                <text x="672" y="277">ENGLAND</text>
                <text x="313" y="253">WALES</text>
                <text x="843" y="354">NORTH SEA</text>
                <text x="121" y="358">IRISH SEA</text>
              </svg>
              <span className={`${styles.mapLabel} ${styles.labelEdinburgh}`}>Edinburgh</span>
              <span className={`${styles.mapLabel} ${styles.labelManchester}`}>Manchester</span>
              <span className={`${styles.mapLabel} ${styles.labelCardiff}`}>Cardiff</span>
              <span className={`${styles.mapLabel} ${styles.labelLondon}`}>London</span>
              {filteredChurches.map((church) => (
                <button
                  key={church.id}
                  className={`${styles.mapPin} ${selectedChurch === church.id ? styles.mapPinSelected : ''}`}
                  style={{ left: church.mapPosition.left, top: church.mapPosition.top }}
                  type="button"
                  aria-label={`Show ${church.name} in ${church.place}`}
                  title={`${church.name} — ${church.place}`}
                  onClick={() => setSelectedChurch(selectedChurch === church.id ? '' : church.id)}
                >
                  <PinIcon />
                </button>
              ))}
              <span className={styles.mapAttribution}>Illustrative map preview</span>
              {selectedChurch && (
                <div className={styles.mapPopup}>
                  <button
                    className={styles.popupClose}
                    type="button"
                    aria-label="Close church details"
                    onClick={() => setSelectedChurch('')}
                  >
                    ×
                  </button>
                  <strong>{churches.find((church) => church.id === selectedChurch)?.name}</strong>
                  <span>{churches.find((church) => church.id === selectedChurch)?.address}</span>
                </div>
              )}
              {filteredChurches.length === 0 && (
                <div className={styles.emptyMap}>No sample churches match that search.</div>
              )}
            </div>
          </section>
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
                    <p className={styles.churchNote}>
                      This church is included in the Evangelical Alliance directory.
                    </p>
                  )}
                </li>
              ))}
              {filteredChurches.length === 0 && (
                <li className={styles.emptyList}>
                  No sample churches match your search. Try another name, postcode or place.
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
            Map pins show illustrative sample locations. The addresses shown are where the churches meet,
            and not necessarily the correspondence address.
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
