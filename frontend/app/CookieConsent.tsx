'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'

type Consent = {
  essential: true
  analytics: boolean
}

const CONSENT_KEY = 'ea-cookie-consent'

const DEFAULT_CONSENT: Consent = {
  essential: true,
  analytics: false,
}

const ACCEPT_ALL: Consent = {
  essential: true,
  analytics: true,
}

// Module-level store so useSyncExternalStore always returns a stable snapshot.
let consent: Consent | null = null
let initialized = false
const listeners = new Set<() => void>()

function isConsent(value: unknown): value is Consent {
  if (typeof value !== 'object' || value === null) return false
  const stored = value as Record<string, unknown>
  return stored.essential === true && typeof stored.analytics === 'boolean'
}

function readConsent(): Consent | null {
  if (initialized) return consent
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    consent = isConsent(parsed) ? { essential: true, analytics: parsed.analytics } : null
  } catch {
    consent = null
  }
  initialized = true
  return consent
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Consent | null {
  return readConsent()
}

function getServerSnapshot(): Consent | null {
  return null
}

function saveConsent(value: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value))
  } catch {
    // localStorage unavailable (private mode / blocked) — still dismiss the banner.
  }
  consent = value
  initialized = true
  listeners.forEach((listener) => listener())
}

export default function CookieConsent() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [showPreferences, setShowPreferences] = useState(false)
  const [selectedConsent, setSelectedConsent] = useState(DEFAULT_CONSENT)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  if (current) return null

  function openPreferences() {
    setSelectedConsent(current ?? DEFAULT_CONSENT)
    setShowPreferences(true)
  }

  function toggleCategory(category: string) {
    setExpandedCategory((expanded) => (expanded === category ? null : category))
  }

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-labelledby={showPreferences ? 'cookie-preferences-title' : 'cookie-consent-title'}
    >
      {showPreferences ? (
        <>
          <div className="cookie-consent__preferences-header">
            <h2 id="cookie-preferences-title" className="cookie-consent__title">
              Consent Preferences Center
            </h2>
            <button
              className="cookie-consent__close"
              type="button"
              aria-label="Close preferences"
              onClick={() => setShowPreferences(false)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="cookie-consent__preferences">
            <section className="cookie-consent__section">
              <h3>Cookie Usage</h3>
              <p>
                We use cookies to enhance your experience of using our website. Some essential
                features won&rsquo;t work without them.
              </p>
            </section>

            <section className="cookie-consent__category">
              <div className="cookie-consent__category-heading">
                <button
                  className="cookie-consent__category-disclosure"
                  type="button"
                  aria-expanded={expandedCategory === 'essential'}
                  aria-controls="cookie-essential-description"
                  onClick={() => toggleCategory('essential')}
                >
                  Strictly Necessary Cookies
                  <span className="cookie-consent__badge">Always Enabled</span>
                </button>
                <label className="cookie-consent__toggle">
                  <input type="checkbox" checked disabled aria-label="Strictly necessary cookies" />
                  <span aria-hidden="true" />
                </label>
              </div>
              <p
                className="cookie-consent__category-description"
                id="cookie-essential-description"
                hidden={expandedCategory !== 'essential'}
              >
                These cookies are required for the website to work as intended.
              </p>
            </section>

            <section className="cookie-consent__category">
              <div className="cookie-consent__category-heading">
                <button
                  className="cookie-consent__category-disclosure"
                  type="button"
                  aria-expanded={expandedCategory === 'analytics'}
                  aria-controls="cookie-analytics-description"
                  onClick={() => toggleCategory('analytics')}
                >
                  Analytics Cookies
                </button>
                <label className="cookie-consent__toggle">
                  <input
                    type="checkbox"
                    checked={selectedConsent.analytics}
                    onChange={(event) =>
                      setSelectedConsent({ essential: true, analytics: event.target.checked })
                    }
                    aria-label="Analytics cookies"
                  />
                  <span aria-hidden="true" />
                </label>
              </div>
              <p
                className="cookie-consent__category-description"
                id="cookie-analytics-description"
                hidden={expandedCategory !== 'analytics'}
              >
                These cookies help us understand how people use the website so we can improve it.
              </p>
            </section>

            <section className="cookie-consent__section">
              <h3>More information</h3>
              <p>
                For questions about our cookie policy and your choices, read our{' '}
                <Link href="/cookies" className="cookie-consent__link">
                  cookie policy
                </Link>
                .
              </p>
            </section>
          </div>
          <div className="cookie-consent__actions cookie-consent__actions--preferences">
            <button
              className="button button-primary cookie-consent__button"
              type="button"
              onClick={() => saveConsent(ACCEPT_ALL)}
            >
              Accept all
            </button>
            <button
              className="button button-secondary cookie-consent__button"
              type="button"
              onClick={() => saveConsent(DEFAULT_CONSENT)}
            >
              Reject all
            </button>
            <button
              className="button button-secondary cookie-consent__button"
              type="button"
              onClick={() => saveConsent(selectedConsent)}
            >
              Save preferences
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="cookie-consent__body">
            <h2 id="cookie-consent-title" className="cookie-consent__title">
              Cookies on our website
            </h2>
            <p className="cookie-consent__text">
              We use some essential cookies to ensure you get the best experience while on our
              website.
            </p>
          </div>
          <div className="cookie-consent__actions">
            <button
              className="button button-primary cookie-consent__button"
              type="button"
              onClick={() => saveConsent(ACCEPT_ALL)}
            >
              Accept all
            </button>
            <button
              className="button button-secondary cookie-consent__button"
              type="button"
              onClick={() => saveConsent(DEFAULT_CONSENT)}
            >
              Reject all
            </button>
            <button
              className="button button-secondary cookie-consent__button"
              type="button"
              onClick={openPreferences}
            >
              Manage preferences
            </button>
          </div>
          <div className="cookie-consent__footer">
            <div className="cookie-consent__links">
              <Link href="/privacy-policy" className="cookie-consent__footer-link">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="cookie-consent__footer-link">
                Cookie policy
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
