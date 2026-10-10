import Link from 'next/link'

const navItems = [
  { href: '/churches', label: 'Church directory' },
  { href: '/your-area', label: 'Your area' },
  { href: '/contact-mp', label: 'Write to your MP' },
  { href: '/submit', label: 'Submit a church' },
]

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Primary">
      {navItems.map((item) => (
        <Link className="site-nav-link" href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
