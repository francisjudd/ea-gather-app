'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import MapView from '../churches/MapView'
import type { ConstituencyDetail } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import { ChurchMark } from '../churches/icons'
import styles from './constituency.module.css'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SERVICES_PAGE_SIZE = 12
// An A–Z filter is only useful once there are enough churches to scroll through.
const ALPHABET_THRESHOLD = 12

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

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
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')
  const [selected, setSelected] = useState('')
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
              <div className={styles.mobileToggle} role="group" aria-label="Show churches as a list or a map">
                <button type="button" aria-pressed={mobileView === 'list'} onClick={() => setMobileView('list')}>List</button>
                <button type="button" aria-pressed={mobileView === 'map'} onClick={() => setMobileView('map')}>Map</button>
              </div>

              <div className={styles.split} data-mobile-view={mobileView}>
                <div className={styles.listCol}>
                  {detail.churches.length > ALPHABET_THRESHOLD && (
                    <div className={styles.alphabet} role="group" aria-label="Filter churches by first letter">
                      {['All', ...alphabet].map((item) => (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={letter === item}
                          onClick={() => { setLetter(item); setSelected('') }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  <ul className={styles.churchList}>
                    {visibleChurches.map((church) => {
                      const open = selected === church.id
                      return (
                        <li key={church.id} className={styles.churchItem} data-selected={open}>
                          <button
                            type="button"
                            className={styles.churchButton}
                            aria-expanded={open}
                            onClick={() => setSelected(open ? '' : church.id)}
                          >
                            <span className={styles.churchName}>{church.name}</span>
                            {church.denomination && <span className={styles.churchMeta}>{church.denomination}</span>}
                            {church.address && (
                              <span className={styles.churchAddress}>
                                <PinIcon />
                                {church.address}
                              </span>
                            )}
                          </button>
                          {open && (church.website || church.phone) && (
                            <ul className={styles.contactList}>
                              {church.website && (
                                <li><a href={church.website} rel="noopener noreferrer" target="_blank">Visit website</a></li>
                              )}
                              {church.phone && <li><a href={`tel:${church.phone.replace(/\s/g, '')}`}>{church.phone}</a></li>}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                    {visibleChurches.length === 0 && <li className={styles.empty}>No churches start with &ldquo;{letter}&rdquo;.</li>}
                  </ul>
                </div>

                <div className={styles.mapCol}>
                  <MapView
                    churches={mapChurches}
                    selectedChurch={selected}
                    onSelectChurch={setSelected}
                    canvasClassName={styles.mapCanvasTall}
                  />
                </div>
              </div>
              <p className={styles.mapNote}>
                Addresses are where the churches meet, not necessarily their correspondence address. Please contact the
                individual churches for that.
              </p>
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
