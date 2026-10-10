'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import MapView from '../churches/MapView'
import type { ConstituencyDetail } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import { ChurchMark } from '../churches/icons'
import { ChurchCard, ChurchCompact, ChurchDialog } from './ChurchCard'
import styles from './constituency.module.css'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SERVICES_PAGE_SIZE = 12
type View = 'map' | 'cards'
// Inlined at build time, so server and browser agree. Without a key the map can't render,
// so we start on Cards instead.
const hasMapKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
// An A–Z filter is only useful once there are enough churches to scroll through.
const ALPHABET_THRESHOLD = 12

function StatCard({ value, label, note }: { value: number; label: string; note: string }) {
  return (
    <div className={styles.statCard}>
      <dt>{label}</dt>
      <dd>
        <span className={styles.statValue}>{value.toLocaleString('en-GB')}</span>
        <span className={styles.statNote}>{note}</span>
      </dd>
    </div>
  )
}

export default function ConstituencyView({ detail }: { detail: ConstituencyDetail }) {
  const [view, setView] = useState<View>(hasMapKey ? 'map' : 'cards')
  const [highlighted, setHighlighted] = useState('') // set by clicking a map pin
  const [detailId, setDetailId] = useState('') // church shown in the details dialog
  const [letter, setLetter] = useState('All')
  const [category, setCategory] = useState('')
  const [showAllServices, setShowAllServices] = useState(false)

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

  const detailChurch = detail.churches.find((church) => church.id === detailId) ?? null

  // A map pin click highlights the matching card and scrolls it into view.
  useEffect(() => {
    if (highlighted) document.getElementById(`church-${highlighted}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlighted])

  const categories = Object.entries(detail.servicesByCategory).sort((a, b) => b[1] - a[1])
  const filteredServices = detail.services.filter((service) => !category || service.category === category)
  const services = showAllServices ? filteredServices : filteredServices.slice(0, SERVICES_PAGE_SIZE)
  const writeHref = `/contact-mp${detail.churches[0]?.postcode ? `?postcode=${encodeURIComponent(detail.churches[0].postcode)}` : ''}`

  return (
    <div className={churches.page}>
      <header className={churches.header}>
        <Link className={churches.brandLink} href="/" aria-label="Evangelical Alliance home">
          <BrandLockup />
        </Link>
        <SiteNav />
      </header>

      <section className={`ea-hero on-dark ${styles.hero}`} aria-labelledby="page-title">
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/constituency">Constituencies</Link></li>
              <li aria-current="page">{detail.name}</li>
            </ol>
          </nav>

          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>Parliamentary constituency</p>
              <h1 id="page-title" className={`ea-underline ${styles.title}`}>{detail.name}</h1>
              <p className={styles.lede}>
                The churches and community services serving {detail.name}, and the people who represent it.
              </p>
            </div>

            {detail.mp && (
              <aside className={styles.mpCard} aria-label="Member of Parliament">
                <p className={styles.mpLabel}>Your MP</p>
                <p className={styles.mpName}>{detail.mp.name}</p>
                {detail.mp.party && <p className={styles.mpParty}>{detail.mp.party}</p>}
                <Link className={styles.mpCta} href={writeHref}>
                  Write to {detail.mp.name.split(' ')[0]}
                </Link>
              </aside>
            )}
          </div>
        </div>
      </section>

      <main className={styles.container}>
        <dl className={styles.stats} aria-label={`${detail.name} at a glance`}>
          <StatCard value={detail.churchCount} label="Churches" note={`listed in ${detail.name}`} />
          <StatCard value={detail.serviceCount} label="Community services" note="across the constituency" />
          <StatCard value={categories.length} label="Types of support" note="from food to debt advice" />
        </dl>

        <section className={styles.section} aria-labelledby="churches-title">
          <h2 id="churches-title" className="ea-underline" style={{ ['--bleed' as string]: 'var(--page-bleed)' }}>
            Churches in {detail.name}
          </h2>

          {detail.churches.length === 0 ? (
            <p className={styles.empty}>We don&rsquo;t have any churches listed in {detail.name} yet.</p>
          ) : (
            <>
              <div className={styles.viewBar}>
                <div className={styles.viewSwitch} role="group" aria-label="Show churches on a map or as cards">
                  {(['map', 'cards'] as const).map((option) => (
                    <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}>
                      {option === 'map' ? 'Map' : 'Cards'}
                    </button>
                  ))}
                </div>
                <span className={styles.viewCount} aria-live="polite">
                  {detail.churches.length} {detail.churches.length === 1 ? 'church' : 'churches'}
                </span>
              </div>

              {!detail.churches.some((church) => church.programmes.length > 0) && (
                <p className={styles.programmesNote}>
                  We don&rsquo;t have programme details for these churches yet.{' '}
                  <Link href="/submit">Tell us what your church does</Link>
                </p>
              )}

              {detail.churches.length > ALPHABET_THRESHOLD && (
                <div className={styles.alphabet} role="group" aria-label="Filter churches by first letter">
                  {['All', ...alphabet].map((item) => (
                    <button key={item} type="button" aria-pressed={letter === item} onClick={() => { setLetter(item); setHighlighted('') }}>
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {view === 'map' ? (
                <>
                  <div className={styles.split}>
                    <ul className={styles.sideList} aria-label="Churches">
                      {visibleChurches.map((church) => (
                        <ChurchCompact
                          key={church.id}
                          church={church}
                          selected={highlighted === church.id}
                          onSelect={() => setHighlighted(highlighted === church.id ? '' : church.id)}
                          onOpen={() => setDetailId(church.id)}
                        />
                      ))}
                      {visibleChurches.length === 0 && (
                        <li className={styles.empty}>No churches start with &ldquo;{letter}&rdquo;.</li>
                      )}
                    </ul>
                    <div className={styles.mapWrap}>
                      <MapView
                        churches={mapChurches}
                        selectedChurch={highlighted}
                        onSelectChurch={setHighlighted}
                        canvasClassName={styles.mapCanvasTall}
                        focusSelected
                      />
                    </div>
                  </div>
                  <p className={styles.mapNote}>
                    Addresses are where the churches meet, not necessarily their correspondence address. Please contact
                    the individual churches for that.
                  </p>
                </>
              ) : (
                <>
                  <ul className={styles.cardGrid}>
                    {visibleChurches.map((church) => (
                      <ChurchCard
                        key={church.id}
                        church={church}
                        highlighted={highlighted === church.id}
                        onOpen={() => { setHighlighted(church.id); setDetailId(church.id) }}
                      />
                    ))}
                  </ul>
                  {visibleChurches.length === 0 && (
                    <p className={styles.empty}>No churches start with &ldquo;{letter}&rdquo;.</p>
                  )}
                </>
              )}
              <ChurchDialog church={detailChurch} onClose={() => setDetailId('')} />
            </>
          )}
        </section>

        {detail.serviceCount > 0 && (
          <>
            <hr className={`ea-dotted ${styles.divider}`} />
            <section className={styles.section} aria-labelledby="services-title">
              <h2 id="services-title" className="ea-underline" style={{ ['--bleed' as string]: 'var(--page-bleed)' }}>
                Community services in {detail.name}
              </h2>
              <p className={styles.sectionIntro}>
                Support available locally, including warm spaces, food banks and debt advice.
              </p>

              <div className={styles.chips} role="group" aria-label="Filter services by type">
                <button type="button" aria-pressed={category === ''} onClick={() => { setCategory(''); setShowAllServices(false) }}>
                  All ({detail.serviceCount})
                </button>
                {categories.map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={category === name}
                    onClick={() => { setCategory(category === name ? '' : name); setShowAllServices(false) }}
                  >
                    {name} ({count})
                  </button>
                ))}
              </div>

              <ul className={styles.serviceGrid}>
                {services.map((service) => (
                  <li key={service.id} className={styles.serviceCard}>
                    <span className={styles.serviceTag}>{service.category}</span>
                    <strong>{service.name}</strong>
                    {(service.address ?? service.postcode) && (
                      <span className={styles.serviceAddress}>{service.address ?? service.postcode}</span>
                    )}
                    {service.website && (
                      <a href={service.website} rel="noopener noreferrer" target="_blank">Visit website</a>
                    )}
                  </li>
                ))}
              </ul>

              {filteredServices.length > SERVICES_PAGE_SIZE && (
                <button type="button" className={styles.showMore} onClick={() => setShowAllServices((value) => !value)}>
                  {showAllServices ? 'Show fewer' : `Show all ${filteredServices.length}`}
                </button>
              )}
            </section>
          </>
        )}
      </main>

      <footer className={churches.footer}>
        <ChurchMark />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
