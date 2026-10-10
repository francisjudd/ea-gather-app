'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  getPendingSubmissions,
  subscribeToSubmissions,
  approveChurch,
  rejectChurch,
  updateSubmissionInitiatives,
  type ChurchSubmission,
} from '../../lib/churchStore'
import { initiativeTypes } from '../../lib/initiatives'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
  onToggleInitiative,
}: {
  submission: ChurchSubmission
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onToggleInitiative: (id: string, initiative: string) => void
}) {
  return (
    <article className="admin-card">
      <header className="admin-card-header">
        <div>
          <h3 className="admin-card-title">{submission.name}</h3>
          <p className="admin-card-meta">
            {submission.place || submission.address}
            {submission.denomination && <span className="admin-card-dot" aria-hidden="true">·</span>}
            {submission.denomination}
          </p>
        </div>
        <span className="admin-card-date">Submitted {formatDate(submission.submittedAt)}</span>
      </header>

      <dl className="admin-card-details">
        <div className="admin-detail">
          <dt>Address</dt>
          <dd>{submission.address}</dd>
        </div>
        {submission.postcode && (
          <div className="admin-detail">
            <dt>Postcode</dt>
            <dd>{submission.postcode}</dd>
          </div>
        )}
        {submission.operatingHours && (
          <div className="admin-detail">
            <dt>Hours</dt>
            <dd>{submission.operatingHours}</dd>
          </div>
        )}
        <div className="admin-detail">
          <dt>Contact</dt>
          <dd>{submission.contactName} · {submission.contactEmail}</dd>
        </div>
      </dl>

      <div className="admin-section">
        <p className="admin-section-label">INITIATIVES</p>
        <div className="admin-initiative-grid">
          {initiativeTypes.map((initiative) => {
            const checked = submission.initiatives.includes(initiative.id)
            return (
              <label className={`admin-initiative ${checked ? 'admin-initiative-checked' : ''}`} key={initiative.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleInitiative(submission.id, initiative.id)}
                />
                <span>{initiative.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="admin-card-actions">
        <button className="button button-primary" type="button" onClick={() => onApprove(submission.id)}>
          Approve <span aria-hidden="true">→</span>
        </button>
        <button className="button button-quiet" type="button" onClick={() => onReject(submission.id)}>
          Reject
        </button>
      </div>
    </article>
  )
}

const emptySubmissions: ChurchSubmission[] = []

export default function AdminReview() {
  const submissions = useSyncExternalStore(
    subscribeToSubmissions,
    getPendingSubmissions,
    () => emptySubmissions,
  )

  const handleApprove = (id: string) => {
    approveChurch(id)
  }

  const handleReject = (id: string) => {
    rejectChurch(id)
  }

  const handleToggleInitiative = (id: string, initiative: string) => {
    const current = submissions.find((submission) => submission.id === id)
    if (!current) return
    const next = current.initiatives.includes(initiative)
      ? current.initiatives.filter((item) => item !== initiative)
      : [...current.initiatives, initiative]
    updateSubmissionInitiatives(id, next)
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand-lockup" href="/" aria-label="Evangelical Alliance home">
          <span className="brand-name">evangelical <strong>alliance</strong></span>
        </Link>
        <span className="header-caption">Admin · Review</span>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="sidebar-kicker">ADMIN</p>
          <h1>Review submissions.</h1>
          <p className="sidebar-copy">
            Check new church submissions, tag them with the initiatives they run, then approve or reject
            them before they appear in the directory.
          </p>
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="admin-stat-value">{submissions.length}</span>
              <span className="admin-stat-label">Awaiting review</span>
            </div>
          </div>
        </aside>

        <section className="admin-panel" aria-labelledby="admin-title">
          <div className="step-meta">
            <span>ADMIN</span>
            <span className="step-meta-divider" aria-hidden="true">·</span>
            <span>UNAPPROVED DATA</span>
          </div>
          <h2 className="ea-underline" id="admin-title">Unapproved submissions.</h2>

          {submissions.length === 0 ? (
            <div className="admin-empty">
              <p className="admin-empty-title">Nothing to review.</p>
              <p className="admin-empty-copy">
                There are no pending submissions. New churches submitted through the form will appear here.
              </p>
              <Link className="button button-quiet" href="/submit">Go to the submit form</Link>
            </div>
          ) : (
            <div className="admin-list">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onToggleInitiative={handleToggleInitiative}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <span>MORE THAN SUNDAY · CHURCH ACTION</span>
        <span>Admin review · <Link href="/churches">View directory</Link></span>
        <div className="site-footer-legal">
          The Evangelical Alliance. A company limited by guarantee registered in England and Wales No. 123448.
          Registered Charity No England and Wales: 212325, Scotland: SC040576. Registered office: 176 Copenhagen Street, London, N1 0ST.
        </div>
      </footer>
    </main>
  )
}
