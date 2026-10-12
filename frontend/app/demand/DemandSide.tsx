'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import FullNav from '../../components/FullNavigation'
import BrandLockup from '../../components/BrandLockup'
import { SpinnerIcon } from '../../components/LoadingSpinner'
import styles from './demand.module.css'

type ParishDashboard = {
  diocese: string
  deanery: string
  parish: string
  parishCode: string
  pdfUrl: string
}

type Diocese = {
  id: string
  name: string
}

type DashboardResponse = {
  dioceses: Diocese[]
  results: ParishDashboard[]
  error?: string
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16h6M9 10h2" />
    </svg>
  )
}

export default function DemandSide() {
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [diocese, setDiocese] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ParishDashboard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    let active = true
    async function loadDioceses() {
      try {
        const response = await fetch('/api/parish-dashboards')
        if (!response.ok) return
        const data: DashboardResponse = await response.json()
        if (active) setDioceses(data.dioceses)
      } catch {
        // The diocese list is a convenience; the search still works without it.
      }
    }
    loadDioceses()
    return () => {
      active = false
    }
  }, [])

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)

    const params = new URLSearchParams()
    if (diocese) params.set('diocese', diocese)
    if (query.trim()) params.set('search', query.trim())

    try {
      const response = await fetch(`/api/parish-dashboards${params.toString() ? `?${params.toString()}` : ''}`)
      const data: DashboardResponse = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'We could not load the dashboards. Please try again.')
        setResults([])
        return
      }
      setResults(data.results)
    } catch {
      setError('We could not reach the dashboards service. Please try again shortly.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clearSearch() {
    setDiocese('')
    setQuery('')
    setResults([])
    setSearched(false)
    setError('')
  }

  return (
    <div className={styles.page}>
      <FullNav />

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <section className={styles.searchSection} aria-labelledby="page-title">
          <p className={styles.eyebrow}>COMMUNITY NEED</p>
          <h1 id="page-title">The demand side</h1>
          <p className={styles.intro}>
            These dashboards give a one-page parish summary of national census and deprivation data,
            mapped onto Church of England parish boundaries. Use them to understand the needs in your
            community and where your church&apos;s social action can make the most difference.
          </p>

          <form className={styles.searchForm} onSubmit={runSearch} role="search">
            <label className={styles.visuallyHidden} htmlFor="diocese-select">
              Diocese
            </label>
            <select
              id="diocese-select"
              className={styles.dioceseSelect}
              value={diocese}
              onChange={(event) => setDiocese(event.target.value)}
            >
              <option value="">Any diocese</option>
              {dioceses.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <label className={styles.visuallyHidden} htmlFor="parish-search">
              Search by deanery name, parish name or parish code
            </label>
            <input
              id="parish-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by deanery name, parish name or parish code..."
            />

            <button className={styles.searchButton} type="submit" disabled={loading}>
              {loading ? <SpinnerIcon /> : <SearchIcon />}
              <span>{loading ? 'Searching…' : 'Search'}</span>
            </button>
          </form>

          <div className={styles.searchLinks}>
            <button className={styles.clearLink} type="button" onClick={clearSearch}>
              Clear search
            </button>
            <span className={styles.sourceNote}>
              Data source: <a href="https://parishreturns.churchofengland.org/census-dashboards/" target="_blank" rel="noreferrer">Church of England Parish Returns</a>
            </span>
          </div>

          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
        </section>

        {searched && (
          <section className={styles.resultsPanel} aria-label="Parish dashboard results">
            <div className={styles.resultsHeader}>
              <span className={styles.resultCount} aria-live="polite">
                {loading ? <><SpinnerIcon /> Searching…</> : `${results.length} ${results.length === 1 ? 'dashboard' : 'dashboards'}`}
              </span>
            </div>

            {results.length > 0 ? (
              <ul className={styles.resultList}>
                {results.map((item) => (
                  <li key={`${item.diocese}-${item.parishCode}-${item.parish}`} className={styles.resultRow}>
                    <div className={styles.resultMeta}>
                      <span className={styles.resultDiocese}>{item.diocese}</span>
                      <span className={styles.resultDeanery}>{item.deanery}</span>
                    </div>
                    <div className={styles.resultParish}>
                      <strong>{item.parish}</strong>
                      {item.parishCode && <span className={styles.parishCode}>Parish {item.parishCode}</span>}
                    </div>
                    <a
                      className={styles.downloadLink}
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <PdfIcon />
                      <span>Download</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              !loading && (
                <p className={styles.emptyState}>
                  No dashboards match your search. Try a different diocese, deanery, parish name or parish code.
                </p>
              )
            )}
          </section>
        )}

        {!searched && (
          <aside className={styles.aboutNote}>
            <p>
              The Evangelical Alliance is a membership organisation made up of churches and organisations from
              different denominational and independent church backgrounds. Understanding the needs in your local
              area helps churches and policymakers see where community support is most needed.
            </p>
          </aside>
        )}
      </main>

      <footer className={styles.footer}>
        <BrandLockup size="sm" />
        <span>
          <Link href="/sitemap">Sitemap</Link> · © Evangelical Alliance
        </span>
      </footer>
    </div>
  )
}
