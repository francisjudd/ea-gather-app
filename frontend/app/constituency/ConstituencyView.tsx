'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import MapView from '../churches/MapView'
import type { ConstituencyChurch, ConstituencyDetail } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import { ChurchMark, PinIcon } from '../churches/icons'
import styles from './constituency.module.css'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function ChurchCard({ church }: { church: ConstituencyChurch }) {
  return (
    <article className={churches.profileCard} aria-label={`${church.name} profile`}>
      <div className={churches.profileHeader}>
        <div>
          <h3>{church.name}</h3>
          {church.denomination && <p className={churches.profileMeta}>{church.denomination}</p>}
        </div>
      </div>
      {church.address && <p className={churches.profileAddress}>{church.address}</p>}
      <ul className={styles.contactList}>
        {church.website && (
          <li><a href={church.website} rel="noopener noreferrer" target="_blank">Website</a></li>
        )}
        {church.phone && <li><a href={`tel:${church.phone.replace(/\s/g, '')}`}>{church.phone}</a></li>}
      </ul>
    </article>
  )
}

export default function ConstituencyView({ detail }: { detail: ConstituencyDetail }) {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selected, setSelected] = useState('')
  const [letter, setLetter] = useState('All')
  const [category, setCategory] = useState('')

  const visibleChurches = useMemo(
    () => detail.churches.filter((church) => letter === 'All' || church.name.toUpperCase().startsWith(letter)),
    [detail.churches, letter],
  )
  const mapChurches = useMemo(
    () =>
      visibleChurches.flatMap((church) =>
        church.lat != null && church.lng != null
          ? [{ id: church.id, name: church.name, address: church.address ?? '', place: church.postcode ?? '', lat: church.lat, lng: church.lng }]
          : [],
      ),
    [visibleChurches],
  )
  const selectedChurch = detail.churches.find((church) => church.id === selected)
  const categories = Object.entries(detail.servicesByCategory).sort((a, b) => b[1] - a[1])
  const services = detail.services.filter((service) => !category || service.category === category)
  const writeHref = `/contact-mp${detail.churches[0]?.postcode ? `?postcode=${encodeURIComponent(detail.churches[0].postcode)}` : ''}`

  return (
    <div className={churches.page}>
      <header className={churches.header}>
        <Link className={churches.brandLink} href="/" aria-label="Evangelical Alliance home">
          <BrandLockup />
        </Link>
        <SiteNav />
      </header>

      <main className={churches.main}>
        <section className={churches.searchSection} aria-labelledby="page-title">
          <p className={churches.eyebrow}>
            <Link href="/constituency">CONSTITUENCIES</Link> / {detail.name.toUpperCase()}
          </p>
          <h1 id="page-title">{detail.name}</h1>

          <div className={styles.summaryRow}>
            <dl className={styles.stats}>
              <div><dt>Churches</dt><dd>{detail.churchCount}</dd></div>
              <div><dt>Community services</dt><dd>{detail.serviceCount}</dd></div>
            </dl>
            {detail.mp && (
              <aside className={styles.mpCard} aria-label="Member of Parliament">
                <p className={styles.mpLabel}>Your MP</p>
                <p className={styles.mpName}>{detail.mp.name}</p>
                {detail.mp.party && <p className={styles.mpParty}>{detail.mp.party}</p>}
                <Link className={styles.mpCta} href={writeHref}>Write to {detail.mp.name.split(' ')[0]}</Link>
              </aside>
            )}
          </div>

          <div className={churches.viewToolbar}>
            <span className={churches.viewLabel}>View:</span>
            <div className={churches.viewSwitch} role="group" aria-label="Display churches as a map or a list">
              <button className={view === 'map' ? churches.viewActive : ''} type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
                <PinIcon />
                Map
              </button>
              <button className={view === 'list' ? churches.viewActive : ''} type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <path d="M7 5h10M7 10h10M7 15h10" />
                  <circle cx="3" cy="5" r=".8" />
                  <circle cx="3" cy="10" r=".8" />
                  <circle cx="3" cy="15" r=".8" />
                </svg>
                List
              </button>
            </div>
            <span className={churches.resultCount} aria-live="polite">
              {visibleChurches.length} {visibleChurches.length === 1 ? 'church' : 'churches'}
            </span>
          </div>
        </section>

        {detail.churches.length === 0 ? (
          <p className={styles.empty}>We don&rsquo;t have any churches listed in {detail.name} yet.</p>
        ) : view === 'map' ? (
          <>
            <MapView churches={mapChurches} selectedChurch={selected} onSelectChurch={setSelected} />
            {selectedChurch && (
              <div className={churches.profilePanel}>
                <ChurchCard church={selectedChurch} />
              </div>
            )}
            <p className={churches.mapNote}>
              The addresses shown on this map are where the churches meet, and not necessarily the correspondence
              address. Please contact the individual churches for the correspondence address.
            </p>
          </>
        ) : (
          <section className={churches.listPanel} aria-label="Churches in this constituency">
            <div className={churches.alphabet} role="group" aria-label="Filter churches by first letter">
              {['All', ...alphabet].map((item) => (
                <button key={item} className={letter === item ? churches.alphabetActive : ''} type="button" aria-pressed={letter === item} onClick={() => { setLetter(item); setSelected('') }}>
                  {item}
                </button>
              ))}
            </div>
            <ul className={churches.churchList}>
              {visibleChurches.map((church) => (
                <li key={church.id}>
                  <button className={churches.churchRow} type="button" aria-expanded={selected === church.id} onClick={() => setSelected(selected === church.id ? '' : church.id)}>
                    <span>
                      <strong>{church.name}</strong>
                      {church.address && (
                        <span className={churches.address}>
                          <PinIcon />
                          {church.address}
                        </span>
                      )}
                    </span>
                    <span className={churches.rowMeta}><span className={churches.rowChevron} aria-hidden="true">›</span></span>
                  </button>
                  {selected === church.id && (
                    <div className={churches.profileInline}>
                      <ChurchCard church={church} />
                    </div>
                  )}
                </li>
              ))}
              {visibleChurches.length === 0 && <li className={churches.emptyList}>No churches start with &ldquo;{letter}&rdquo;.</li>}
            </ul>
          </section>
        )}

        {detail.serviceCount > 0 && (
          <section className={styles.services} aria-labelledby="services-title">
            <h2 id="services-title">Community services in {detail.name}</h2>
            <div className={churches.facetChips} role="group" aria-label="Filter services by type">
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  className={`${churches.facetChip} ${category === name ? churches.facetChipActive : ''}`}
                  type="button"
                  aria-pressed={category === name}
                  onClick={() => setCategory(category === name ? '' : name)}
                >
                  {name} ({count})
                </button>
              ))}
            </div>
            <ul className={styles.serviceList}>
              {services.map((service) => (
                <li key={service.id}>
                  <strong>{service.name}</strong>
                  <span>{[service.category, service.address ?? service.postcode].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className={churches.footer}>
        <ChurchMark />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
