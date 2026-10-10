import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import SiteFooter from '../../components/SiteFooter'
import { constituencies } from '@/lib/constituencies/source'
import { sitePages } from '@/lib/site'
import { getChurchLinks } from '../churches/church-data'

export const metadata: Metadata = {
  title: 'Sitemap | Evangelical Alliance',
  description: 'Every page on More Than Sunday: tools, constituencies and churches.',
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en-GB')

export default async function SitemapPage() {
  const [constituencyList, churchList] = await Promise.all([constituencies.list(), getChurchLinks()])

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand-lockup" href="/contact-mp" aria-label="More Than Sunday — start again">
          <span className="brand-name">More Than <strong>Sunday</strong></span>
        </Link>
        <div className="site-actions">
          <SiteNav />
        </div>
      </header>

      <div className="cookie-policy sitemap-page">
        <p className="cookie-policy__kicker">SITEMAP</p>
        <h1>Every page on More Than Sunday</h1>

        <section className="cookie-policy__section">
          <h2>Pages</h2>
          <ul className="sitemap-list">
            {sitePages
              .filter(({ path }) => path !== '/sitemap')
              .map(({ path, label }) => (
                <li key={path}>
                  <Link href={path}>{label}</Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="cookie-policy__section">
          <h2>Constituencies</h2>
          <ul className="sitemap-list sitemap-list--columns">
            {[...constituencyList].sort(byName).map(({ slug, name }) => (
              <li key={slug}>
                <Link href={`/constituencies/${slug}`}>{name}</Link>
              </li>
            ))}
          </ul>
        </section>

        {churchList.length > 0 && (
          <section className="cookie-policy__section">
            <h2>Churches</h2>
            <ul className="sitemap-list sitemap-list--columns">
              {[...churchList].sort(byName).map(({ id, name }) => (
                <li key={id}>
                  <Link href={`/churches/${encodeURIComponent(id)}`}>{name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
