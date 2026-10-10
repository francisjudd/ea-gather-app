'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import FullNav from '../../components/FullNavigation'
import BrandLockup from '../../components/BrandLockup'
import type { ConstituencySummary } from '@/lib/constituencies/types'
import { useInfiniteList } from '@/lib/useInfiniteList'
import churches from '../churches/churches.module.css'
import { SearchIcon } from '../churches/icons'
import styles from './constituency.module.css'

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

export default function ConstituencyIndex({ constituencies }: { constituencies: ConstituencySummary[] }) {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('All')
  const availableLetters = useMemo(
    () =>
      [...new Set(
        constituencies
          .map(({ name }) => name.trim().charAt(0).toLocaleUpperCase('en-GB'))
          .filter((initial) => /^[A-Z]$/.test(initial)),
      )].sort(),
    [constituencies],
  )

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return constituencies.filter(
      (item) =>
        (letter === 'All' || item.name.toUpperCase().startsWith(letter)) &&
        (!needle || item.name.toLowerCase().includes(needle)),
    )
  }, [constituencies, query, letter])
  const { visibleItems, visibleCount, hasMore, loadMore, sentinelRef } = useInfiniteList(matches, {
    batchSize: 40,
    resetKey: `${letter}:${query.trim().toLocaleLowerCase('en-GB')}`,
  })

  return (
    <div className={churches.page}>
      <FullNav />

      <section className={`ea-hero on-dark ${styles.hero}`} aria-labelledby="page-title">
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">Constituencies</li>
            </ol>
          </nav>
          <p className={styles.eyebrow}>Evangelical Alliance directory</p>
          <h1 id="page-title" className={`ea-underline ${styles.title}`}>Find your constituency</h1>

          <form className={`${churches.searchForm} ${styles.heroSearch}`} role="search" onSubmit={(event) => event.preventDefault()}>
            <label className={churches.visuallyHidden} htmlFor="constituency-search">
              Search by constituency name
            </label>
            <input
              id="constituency-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by constituency name..."
            />
            <button className={churches.searchButton} type="submit">
              <SearchIcon />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      <main id="main-content" className={`${styles.container} ${styles.indexMain}`} tabIndex={-1}>
        <div className={styles.indexBar}>
          <span className={styles.indexCount} aria-live="polite">
            {plural(matches.length, 'constituency', 'constituencies')}
          </span>
          <div className={styles.alphabet} role="group" aria-label="Filter constituencies by first letter">
            {['All', ...availableLetters].map((item) => (
              <button key={item} type="button" aria-pressed={letter === item} onClick={() => setLetter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <ul className={styles.indexGrid} aria-label="Constituencies">
          {visibleItems.map((item) => (
            <li key={item.slug}>
              <Link className={styles.indexCard} href={`/constituencies/${item.slug}`}>
                <span className={styles.indexName}>{item.name}</span>
                <span className={styles.indexMeta}>
                  {plural(item.churchCount, 'church', 'churches')} · {plural(item.serviceCount, 'service', 'services')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {matches.length === 0 && <p className={styles.empty}>No constituencies match your search.</p>}
        <div className="infinite-list-controls">
          <p className="infinite-list-status" role="status" aria-live="polite">
            Showing {visibleCount} of {matches.length}{' '}
            {matches.length === 1 ? 'constituency' : 'constituencies'}.
          </p>
          {hasMore && (
            <button className="infinite-list-button" type="button" onClick={loadMore}>
              Load more constituencies
            </button>
          )}
        </div>
        {hasMore && <div className="infinite-list-sentinel" ref={sentinelRef} aria-hidden="true" />}
      </main>

      <footer className={churches.footer}>
        <BrandLockup size="sm" />
        <span>
          <Link href="/sitemap">Sitemap</Link> · © Evangelical Alliance
        </span>
      </footer>
    </div>
  )
}
