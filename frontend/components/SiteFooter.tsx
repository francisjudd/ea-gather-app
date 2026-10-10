import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>MORE THAN SUNDAY · CHURCH ACTION</span>
      <span>
        Questions? <a href="mailto:advocacy@eauk.org">Contact the advocacy team</a> · <Link href="/sitemap">Sitemap</Link>
      </span>
      <div className="site-footer-legal">
        The Evangelical Alliance. A company limited by guarantee registered in England and Wales No. 123448.
        Registered Charity No England and Wales: 212325, Scotland: SC040576. Registered office: 176 Copenhagen Street, London, N1 0ST.
      </div>
    </footer>
  )
}
