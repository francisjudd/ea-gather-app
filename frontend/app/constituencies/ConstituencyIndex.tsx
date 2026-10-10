'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import type { ConstituencySummary } from '@/lib/constituencies/types'
import churches from '../churches/churches.module.css'
import { ChurchMark, SearchIcon } from '../churches/icons'
import styles from './constituency.module.css'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function ConstituencyIndex({ constituencies }: { constituencies: ConstituencySummary[] }) {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('All')

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return constituencies.filter(
      (item) =>
        (letter === 'All' || item.name.toUpperCase().startsWith(letter)) &&
        (!needle || item.name.toLowerCase().includes(needle)),
    )
  }, [constituencies, query, letter])

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
          <p className={churches.eyebrow}>EVANGELICAL ALLIANCE DIRECTORY</p>
          <h1 id="page-title">Find your constituency</h1>
          <form className={churches.searchForm} role="search" onSubmit={(event) => event.preventDefault()}>
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
          <div className={churches.viewToolbar}>
            <span className={churches.resultCount} aria-live="polite">
              {matches.length} {matches.length === 1 ? 'constituency' : 'constituencies'}
            </span>
          </div>
        </section>

        <section className={churches.listPanel} aria-label="Constituency list">
          <div className={churches.alphabet} role="group" aria-label="Filter constituencies by first letter">
            {['All', ...alphabet].map((item) => (
              <button
                key={item}
                className={letter === item ? churches.alphabetActive : ''}
                type="button"
                aria-pressed={letter === item}
                onClick={() => setLetter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <ul className={churches.churchList}>
            {matches.map((item) => (
              <li key={item.slug}>
                <Link className={churches.churchRow} href={`/constituencies/${item.slug}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <span className={styles.rowCounts}>
                      {item.churchCount} {item.churchCount === 1 ? 'church' : 'churches'} · {item.serviceCount}{' '}
                      {item.serviceCount === 1 ? 'service' : 'services'}
                    </span>
                  </span>
                  <span className={churches.rowMeta}>
                    <span className={churches.rowChevron} aria-hidden="true">›</span>
                  </span>
                </Link>
              </li>
            ))}
            {matches.length === 0 && <li className={churches.emptyList}>No constituencies match your search.</li>}
          </ul>
        </section>
      </main>

      <footer className={churches.footer}>
        <ChurchMark />
        <span>© Evangelical Alliance</span>
      </footer>
    </div>
  )
}
