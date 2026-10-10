'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import MapView from '../churches/MapView'
import type { ConstituencyChurch, ConstituencyDetail, ConstituencyService } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import { ChurchMark } from '../churches/icons'
import { ChurchCard, ChurchCompact, ChurchDialog, ServiceCard, ServiceCompact } from './ChurchCard'
import styles from './constituency.module.css'

type View = 'map' | 'cards'
type TypeFilter = 'all' | 'churches' | 'services'
type Item =
  | { kind: 'church'; key: string; name: string; church: ConstituencyChurch }
  | { kind: 'service'; key: string; name: string; service: ConstituencyService }
// Inlined at build time, so server and browser agree. Without a key the map can't render,
// so we start on Cards instead.
const hasMapKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

function WandIcon() {
  return (
    <svg className={styles.mpCtaIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
      <path d="m14 7 3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9" />
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
  const [view, setView] = useState<View>(hasMapKey ? 'map' : 'cards')
  const [type, setType] = useState<TypeFilter>('all')
  const [highlighted, setHighlighted] = useState('') // item key, set by a card or a map pin
  const [detailId, setDetailId] = useState('') // church shown in the details dialog

  // One merged set of content; the type toggle just filters it.
  const allItems = useMemo<Item[]>(() => {
    const out: Item[] = []
    if (type !== 'services') {
      detail.churches.forEach((church) => out.push({ kind: 'church', key: church.id, name: church.name, church }))
    }
    if (type !== 'churches') {
      detail.services.forEach((service) =>
        out.push({ kind: 'service', key: `svc-${service.id}`, name: service.name, service }),
      )
    }
    return out
  }, [detail.churches, detail.services, type])

  const mapItems = useMemo(
    () =>
      allItems.flatMap((item) => {
        const source = item.kind === 'church' ? item.church : item.service
        return source.lat != null && source.lng != null
          ? [{ id: item.key, name: item.name, address: source.address ?? '', place: source.postcode ?? '', lat: source.lat, lng: source.lng, kind: item.kind }]
          : []
      }),
    [allItems],
  )

  const detailChurch = detail.churches.find((church) => church.id === detailId) ?? null

  // A map pin click highlights the matching item and scrolls it into view.
  useEffect(() => {
    if (highlighted) document.getElementById(`item-${highlighted}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlighted])

  const categories = Object.entries(detail.servicesByCategory).sort((a, b) => b[1] - a[1])
  const total = detail.churches.length + detail.services.length
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
              <li><Link href="/constituencies">Constituencies</Link></li>
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
                  <WandIcon />
                  Draft email to {detail.mp.name.split(' ')[0]}
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

        <section className={styles.section} aria-label={`Churches and community services in ${detail.name}`}>
          {total === 0 ? (
            <p className={styles.empty}>We don&rsquo;t have any churches or community services listed in {detail.name} yet.</p>
          ) : (
            <>
              <div className={styles.controlBar}>
                <div className={styles.viewSwitch} role="group" aria-label="Show as a map or as cards">
                  {(['map', 'cards'] as const).map((option) => (
                    <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}>
                      {option === 'map' ? 'Map' : 'Cards'}
                    </button>
                  ))}
                </div>
                <div className={styles.viewSwitch} role="group" aria-label="Choose what to show">
                  {([
                    ['all', 'All', total],
                    ['churches', 'Churches', detail.churches.length],
                    ['services', 'Community services', detail.services.length],
                  ] as const).map(([value, label, count]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={type === value}
                      onClick={() => { setType(value); setHighlighted('') }}
                    >
                      {label} <span className={styles.toggleCount}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {type !== 'services' && detail.churches.length > 0 && !detail.churches.some((church) => church.programmes.length > 0) && (
                <p className={styles.programmesNote}>
                  We don&rsquo;t have programme details for these churches yet.{' '}
                  <Link href="/submit">Tell us what your church does</Link>
                </p>
              )}

              {allItems.length === 0 ? (
                <p className={styles.empty}>
                  {type === 'churches'
                    ? `We don’t have any churches listed in ${detail.name} yet.`
                    : `We don’t have any community services listed in ${detail.name} yet.`}
                </p>
              ) : view === 'map' ? (
                <>
                  <div className={styles.split}>
                    <ul className={styles.sideList} aria-label="Churches and community services">
                      {allItems.map((item) =>
                        item.kind === 'church' ? (
                          <ChurchCompact
                            key={item.key}
                            church={item.church}
                            selected={highlighted === item.key}
                            onSelect={() => setHighlighted(highlighted === item.key ? '' : item.key)}
                            onOpen={() => setDetailId(item.church.id)}
                          />
                        ) : (
                          <ServiceCompact
                            key={item.key}
                            service={item.service}
                            selected={highlighted === item.key}
                            onSelect={() => setHighlighted(highlighted === item.key ? '' : item.key)}
                          />
                        ),
                      )}
                    </ul>
                    <div className={styles.mapWrap}>
                      <MapView
                        churches={mapItems}
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
                    {allItems.map((item) =>
                      item.kind === 'church' ? (
                        <ChurchCard
                          key={item.key}
                          church={item.church}
                          highlighted={highlighted === item.key}
                          onOpen={() => { setHighlighted(item.key); setDetailId(item.church.id) }}
                        />
                      ) : (
                        <ServiceCard
                          key={item.key}
                          service={item.service}
                          highlighted={highlighted === item.key}
                          onSelect={() => setHighlighted(highlighted === item.key ? '' : item.key)}
                        />
                      ),
                    )}
                  </ul>
                </>
              )}
              <ChurchDialog church={detailChurch} onClose={() => setDetailId('')} />
            </>
          )}
        </section>
      </main>

      <footer className={churches.footer}>
        <ChurchMark />
        <span>
          <Link href="/sitemap">Sitemap</Link> · © Evangelical Alliance
        </span>
      </footer>
    </div>
  )
}
