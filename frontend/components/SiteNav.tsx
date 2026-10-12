'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/constituencies', label: 'Find your constituency' },
  { href: '/churches', label: 'Find churches' },
  { href: '/services', label: 'Find services' },
]

const navButtons = [
  { href: '/contact-mp', label: 'Write to your MP', variant: 'primary', wand: true },
  { href: '/submit', label: 'Submit a church', variant: 'secondary', wand: false },
] as const

// Same wand as the "Draft email" button on the constituency pages.
function WandIcon() {
  return (
    <svg className="site-nav-button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
      <path d="m14 7 3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9" />
    </svg>
  )
}

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={toggleRef}
        className="site-nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false)
            toggleRef.current?.focus()
          }
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {open ? 'Close menu' : 'Menu'}
      </button>
      <nav
        id="primary-navigation"
        className="site-nav"
        aria-label="Primary"
        data-open={open}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false)
            toggleRef.current?.focus()
          }
        }}
      >
        {navItems.map((item) => (
          <Link className="site-nav-link" href={item.href} key={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <span className="site-nav-buttons">
          {navButtons.map((item) => (
            <Link
              className={`site-nav-button site-nav-button--${item.variant}`}
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.wand && <WandIcon />}
              {item.label}
            </Link>
          ))}
        </span>
      </nav>
    </>
  )
}
