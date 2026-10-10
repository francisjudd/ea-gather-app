'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import BrandLockup from '../../components/BrandLockup'
import styles from './your-area.module.css'
import {
  sampleAreas,
  summarizeArea,
  buildTalkingPoints,
  activityCatalog,
  formatReach,
  type AreaSummary,
} from './area-data'

const CATEGORY_ICONS: Record<string, string> = {
  practical: 'M6 12h2m0 0 2-3m-2 3 2 3m3-3h4',
  youth: 'M8 8h8M8 12h8M8 16h5M12 8v8',
  wellbeing: 'M12 20s-7-4.5-9.3-8A5 5 0 0 1 12 6a5 5 0 0 1 9.3 6C19 15.5 12 20 12 20Z',
  vulnerable: 'M12 4l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-3Z',
  environment: 'M12 20c4-1 6-4 6-9-3 0-6 1-7 5m1 4C8 17 6 13 6 9c2 0 4 1 5 5',
}

function CategoryIcon({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={CATEGORY_ICONS[id]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}

export default function YourArea() {
  const [activeConstituency, setActiveConstituency] = useState(sampleAreas[0].constituency)
  const [query, setQuery] = useState('')
  const [queryMessage, setQueryMessage] = useState('')

  const activeArea = sampleAreas.find((area) => area.constituency === activeConstituency)
  const summary = useMemo<AreaSummary>(
    () => summarizeArea(activeArea?.churches ?? []),
    [activeArea],
  )
  const talkingPoints = useMemo(() => buildTalkingPoints(activeArea, summary), [activeArea, summary])

  const mpHref = activeArea
    ? `/contact-mp?postcode=${encodeURIComponent(activeArea.postcode)}`
    : '/contact-mp'

  function chooseArea(constituency: string) {
    setActiveConstituency(constituency)
    setQueryMessage('')
    setQuery('')
  }

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = query.trim().toLocaleLowerCase('en-GB')
    const compact = normalized.replace(/[^a-z0-9]/g, '')
    const match = sampleAreas.find(
      (area) =>
        area.constituency.toLocaleLowerCase('en-GB').includes(normalized)
        || area.postcode.replace(/[^a-z0-9]/g, '') === compact,
    )
    if (match) {
      chooseArea(match.constituency)
    } else {
      setQueryMessage(
        `We don't have sample data for “${query.trim()}” yet. Choose a sample area below.`,
      )
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand-lockup" href="/" aria-label="Evangelical Alliance home">
          <BrandLockup />
        </Link>
        <SiteNav />
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>MORE THAN SUNDAY · LOCAL VIEW</p>
        <h1>The church social action in <span>{activeArea?.constituency ?? 'your area'}</span>.</h1>
        <p className={styles.heroCopy}>
          See the churches and projects near you — then use the picture they build together to write a
          letter to your MP.
        </p>
      </section>

      <div className={styles.content}>
        <section className={styles.controls} aria-label="Choose your area">
          <form className={styles.lookup} onSubmit={submitLookup}>
            <label className="visually-hidden" htmlFor="area-lookup">Postcode or constituency</label>
            <input
              id="area-lookup"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter a postcode or constituency"
              autoComplete="postal-code"
            />
            <button className="button button-primary" type="submit">Find my area</button>
          </form>
          {queryMessage && <p className={styles.note} role="status">{queryMessage}</p>}
          <div className={styles.sampleChips} aria-label="Sample areas">
            <span className={styles.sampleLabel}>Preview areas:</span>
            {sampleAreas.map((area) => (
              <button
                key={area.constituency}
                className={styles.sampleChip}
                data-active={area.constituency === activeConstituency}
                type="button"
                aria-pressed={area.constituency === activeConstituency}
                onClick={() => chooseArea(area.constituency)}
              >
                {area.constituency}
              </button>
            ))}
          </div>
        </section>

        {activeArea && (
          <section className={styles.report} aria-label={`${activeArea.constituency} social action report`}>
            <div className={styles.reportHeader}>
              <div>
                <p className={styles.eyebrow}>YOUR CONSTITUENCY</p>
                <h2 className="ea-underline">{activeArea.constituency}</h2>
                <p className={styles.reportMeta}>
                  Preview of {summary.churchCount} churches. Figures are approximate and for demonstration.
                </p>
              </div>
              <div className={styles.mpBlurb}>
                <p className={styles.eyebrow}>YOUR MP</p>
                <p className={styles.mpName}>{activeArea.mpName}</p>
                <a className="text-link" href={`mailto:${activeArea.mpEmail}`}>{activeArea.mpEmail}</a>
              </div>
            </div>

            <div className={styles.statGrid}>
              <StatCard value={summary.churchCount} label="Churches in the area" />
              <StatCard value={summary.projectCount} label="Social action projects" />
              <StatCard value={formatReach(summary.totalReach)} label="People reached each week" />
              <StatCard value={formatReach(summary.totalAttendance)} label="People at Sunday services" />
            </div>

            <section className={styles.block} aria-labelledby="impact-heading">
              <h3 id="impact-heading" className="ea-underline">Impact by area</h3>
              <ul className={styles.catList}>
                {summary.byCategory.map((category) => (
                  <li key={category.id} className={styles.catRow}>
                    <span className={styles.catChip} data-cat={category.id}>
                      <CategoryIcon id={category.id} />
                      {category.label}
                    </span>
                    <span className={styles.catReach}>{formatReach(category.reach)} <em>people / week</em></span>
                    <span className={styles.catCount}>{category.count} projects</span>
                  </li>
                ))}
              </ul>
            </section>


            <section className={styles.block} aria-labelledby="churches-heading">
              <h3 id="churches-heading" className="ea-underline">Churches and their projects</h3>
              <ul className={styles.churchList}>
                {activeArea.churches.map((church) => (
                  <li key={church.id} className={styles.churchCard}>
                    <div className={styles.churchHeader}>
                      <h4>{church.name}</h4>
                      <p className={styles.churchMeta}>
                        {church.denomination} · {formatReach(church.attendance)} attending
                      </p>
                    </div>
                    <ul className={styles.projectChips}>
                      {church.projects.map((project) => {
                        const activity = activityCatalog[project.activityId]
                        if (!activity) return null
                        return (
                          <li key={project.activityId}>
                            <span className={styles.projectChip}>
                              <CategoryIcon id={activity.category} />
                              {activity.label}
                            </span>
                            <span className={styles.projectReach}>~{formatReach(project.reach)} / {project.frequency}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.letterPanel} aria-labelledby="letter-heading">
              <p className={styles.eyebrow}>FOR YOUR LETTER TO YOUR MP</p>
              <h3 id="letter-heading" className="ea-underline">Talking points from this area</h3>
              <ul className="ea-list">
                {talkingPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
              <div className="action-row">
                <Link className="button button-primary" href={mpHref}>Use this to write to your MP <span aria-hidden="true">→</span></Link>
                <a className="button button-quiet" style={{color: "white"}} href={`mailto:${activeArea.mpEmail}`}>Email {activeArea.mpName} directly</a>
              </div>
              <p className={styles.letterNote}>
                These figures are drawn from a small sample so you can see how the numbers read. They are
                not a full census of the constituency.
              </p>
            </section>
          </section>
        )}
      </div>

      <footer className="site-footer">
        <span>MORE THAN SUNDAY · CHURCH ACTION</span>
        <span>Questions? <a href="mailto:advocacy@eauk.org">Contact the advocacy team</a></span>
        <div className="site-footer-legal">
          The Evangelical Alliance. A company limited by guarantee registered in England and Wales No. 123448.
          Registered Charity No England and Wales: 212325, Scotland: SC040576. Registered office: 176 Copenhagen Street, London, N1 0ST.
        </div>
      </footer>
    </main>
  )
}

