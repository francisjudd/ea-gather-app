'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'

type Consent = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

const CONSENT_KEY = 'ea-cookie-consent'

const DEFAULT_CONSENT: Consent = {
  essential: true,
  analytics: false,
  marketing: false,
}

// Module-level store so useSyncExternalStore always returns a stable snapshot.
let consent: Consent | null = null
let initialized = false
const listeners = new Set<() => void>()

function readConsent(): Consent | null {
  if (initialized) return consent
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    consent = raw ? (JSON.parse(raw) as Consent) : null
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

  if (current) return null

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent__body">
        <h2 id="cookie-consent-title" className="cookie-consent__title">
          Cookies on this site
        </h2>
        <p className="cookie-consent__text">
          We use cookies to make this site work and to understand how it is used. You can accept all
          cookies, or choose to allow only the essential ones. Read our{' '}
          <Link href="/cookies" className="cookie-consent__link">
            cookie policy
          </Link>{' '}
          for more detail.
        </p>
      </div>
      <div className="cookie-consent__actions">
        <button
          className="button button-primary cookie-consent__button"
          type="button"
          onClick={() => saveConsent({ ...DEFAULT_CONSENT, analytics: true, marketing: true })}
        >
          Accept all
        </button>
        <button
          className="button button-secondary cookie-consent__button"
          type="button"
          onClick={() => saveConsent(DEFAULT_CONSENT)}
        >
          Essential only
        </button>
      </div>
    </div>
  )
}
