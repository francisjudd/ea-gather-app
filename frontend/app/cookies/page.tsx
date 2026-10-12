import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import SiteFooter from '../../components/SiteFooter'

export const metadata: Metadata = {
  title: 'Cookie policy | Evangelical Alliance',
  description: 'How the More Than Sunday site uses cookies and how you can control them.',
}

export default function CookiePolicyPage() {
  return (
    <main id="main-content" className="app-shell" tabIndex={-1}>
      <header className="site-header">
        <Link className="brand-lockup" href="/contact-mp" aria-label="More Than Sunday — start again">
          <span className="brand-name">More Than <strong>Sunday</strong></span>
        </Link>
        <div className="site-actions">
          <SiteNav />
        </div>
      </header>

      <div className="cookie-policy">
        <p className="cookie-policy__kicker">COOKIE POLICY</p>
        <h1>How we use cookies</h1>
        <p className="cookie-policy__intro">
          This page explains what cookies are, how the More Than Sunday site uses them, and how you
          can control them.
        </p>

        <section className="cookie-policy__section">
          <h2>What are cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the
            site remember your preferences and understand how it is used. Some cookies are essential
            for the site to work; others help us improve it.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Essential cookies</h2>
          <p>
            These are required for the site to function. They include remembering your cookie
            preferences and, where you are using the letter tool, saving your progress in your
            browser. They cannot be switched off.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Analytics cookies</h2>
          <p>
            These help us understand how visitors use the site — which pages are visited and how
            people move around it. You can reject these by choosing &ldquo;Reject all&rdquo; or
            switch them off in the preferences center.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Managing your preferences</h2>
          <p>
            When you first visit the site, you can accept all cookies, reject optional cookies, or
            manage your preferences. Strictly necessary cookies are always enabled. In the
            preferences center, you can choose whether to allow analytics cookies before saving your
            choice. To make a new choice later, clear your browser&rsquo;s stored data for this site;
            the consent banner will appear again on your next visit.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Contact us</h2>
          <p>
            If you have any questions about this cookie policy or how we handle your data, contact the
            advocacy team at{' '}
            <a href="mailto:advocacy@eauk.org">advocacy@eauk.org</a>.
          </p>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
