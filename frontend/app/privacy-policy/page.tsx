import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy policy | Evangelical Alliance',
  description: 'How the More Than Sunday site handles your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand-lockup" href="/contact-mp" aria-label="More Than Sunday — start again">
          <span className="brand-name">More Than <strong>Sunday</strong></span>
        </Link>
        <div className="site-actions">
          <span className="header-caption">An initiative from the Evangelical Alliance</span>
          <nav aria-label="Primary">
            <Link className="site-nav-link" href="/churches">Church directory</Link>
          </nav>
        </div>
      </header>

      <div className="cookie-policy">
        <p className="cookie-policy__kicker">PRIVACY POLICY</p>
        <h1>How we handle your data</h1>
        <p className="cookie-policy__intro">
          This page explains what personal data the More Than Sunday site collects, why we collect
          it, and how you can control it.
        </p>

        <section className="cookie-policy__section">
          <h2>What we collect</h2>
          <p>
            When you use this site we may collect information you provide directly, such as the
            details you enter when contacting your MP or submitting a church. We also use cookies to
            understand how the site is used; see our{' '}
            <Link href="/cookies">cookie policy</Link> for more detail.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>How we use your data</h2>
          <p>
            We use the information you provide to deliver the services you ask for, such as sending a
            message to your MP or listing a church. We do not sell your personal data.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Your rights</h2>
          <p>
            You can ask us to access, correct, or delete the personal data we hold about you. You can
            also object to or restrict certain processing. To exercise any of these rights, contact
            the advocacy team at{' '}
            <a href="mailto:advocacy@eauk.org">advocacy@eauk.org</a>.
          </p>
        </section>

        <section className="cookie-policy__section">
          <h2>Contact us</h2>
          <p>
            If you have any questions about this privacy policy or how we handle your data, contact
            the advocacy team at{' '}
            <a href="mailto:advocacy@eauk.org">advocacy@eauk.org</a>.
          </p>
        </section>
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
