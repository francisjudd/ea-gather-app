// Site-wide constants shared by the XML sitemap (app/sitemap.ts), robots.txt and the
// human-readable sitemap page (/sitemap).

// Absolute origin for sitemap URLs. Set NEXT_PUBLIC_SITE_URL once the site has a custom
// domain; until then Vercel's production URL is used.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/+$/, '')

// Public, indexable top-level pages. Admin, API routes and the individual contact-mp
// steps are deliberately left out.
export const sitePages = [
  { path: '/contact-mp', label: 'Write to your MP' },
  { path: '/constituencies', label: 'Find your constituency' },
  { path: '/churches', label: 'Find churches' },
  { path: '/services', label: 'Find services' },
  { path: '/demand', label: 'Community need' },
  { path: '/submit', label: 'Submit a church' },
  { path: '/privacy-policy', label: 'Privacy policy' },
  { path: '/cookies', label: 'Cookie policy' },
  { path: '/sitemap', label: 'Sitemap' },
] as const
