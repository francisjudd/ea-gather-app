import Link from 'next/link'

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Primary">
      <Link className="site-nav-link" href="/your-area">
        Your area
      </Link>
      <Link className="site-nav-link" href="/demand">
        The demand side
      </Link>
      <Link className="site-nav-link" href="/contact-mp">
        Write to your MP
      </Link>
    </nav>
  )
}
