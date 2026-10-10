<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Evangelical Alliance brand guidelines

The app must follow the Evangelical Alliance brand. The authoritative source is
`../designs/Evangelical-Alliance-Brand-Guidelines.md` (and `.pdf`). Design tokens
live in `app/brand.css` — **reference the CSS variables there, never hardcode
brand hex values in component CSS.** The brand palette and rules below are the
non-negotiable minimum; when in doubt, read the guidelines file.

### Brand colours (guidelines p.27)

| Token | Hex | Role |
|-------|-----|------|
| `--ea-navy` | `#24305F` | Base colour — "should always be very visible" |
| `--ea-teal` | `#449AAE` | Secondary, supports navy |
| `--ea-lime` | `#DCDA60` | Supporting — vibrancy, use sparingly |
| `--ea-feature-dark` | `#2B5E7F` | Text inside feature-light boxes |
| `--ea-feature-light` | `#F5FAFB` | Panel / box background |
| `--ea-dark-grey` | `#383937` | Standard body text |
| `--ea-muted-blue` | `#292D3A` | Near-black for deep surfaces |

Usage ratio (p.29): navy 50% / teal 35% / lime 15%. Lime is **never** used on
light backgrounds (1.5:1 contrast on white); use it on navy/dark only. Teal is
3.2:1 on white — use for icons, borders and large headings only, **not** links or
body text (use `--color-link` = feature-dark instead).

### Typography (pp.31–36)

- **Proxima Nova** is the brand body typeface (Adobe Fonts, family `proxima-nova`).
  It cannot be legally hotlinked, so the stack in `brand.css` puts `proxima-nova`
  first and falls back to **Lato** (the brand's own approved fallback, p.33), then
  Arial. Lato is loaded via `next/font` in `app/layout.tsx`.
- Weights: light (300) for large intro text, regular (400) body, semibold (600)
  sub-headings, bold (700) titles.
- **Waymar Regular** (serif) is for headings/title pages only and requires a
  request to the Evangelical Alliance — do not use it.
- **Playlist Script** is the decorative typeface for personal touches.

### Logo (pp.17–24)

- The logo is lowercase **"evangelical alliance"** with the strapline
  "together making Jesus known". Do not recolour it, change the tagline, change
  the font, tilt/rotate/stretch it, or remove the circles.
- **Do not place the logo on a background of the brand colour palette** (navy,
  teal, lime, feature-dark) or on a dark/cluttered background. The white version
  goes on white; the blue version goes on dark.
- The app renders the real logo artwork from `public/ea-logo.svg` via the shared
  `components/BrandLockup.tsx` component. Keep it lowercase to match the logo.
  The three circles use the brand teal `#449AAE` and lime `#DCDA60` — never
  substitute other teal/lime shades.

### Graphic elements (pp.45–49)

- **Heading underline** (`.ea-underline`): 2pt, teal on light backgrounds, lime on
  dark. Runs from the page bleed to ~2/3 across the heading, equidistant from the
  heading and body text.
- **Dotted line** (`.ea-dotted`): teal dots, used as an alternative to the
  underline or as a divider.
- **Stroked circles** (`.ea-list`, `.ea-hero`): grey-stroked circles as bullets
  (circle height = font size) and as decorative elements over block colour.
- **Gradient background** (`.ea-hero`): navy dominant, fading to teal.

### House style / tone (pp.9–16)

- Always refer to the organisation as the **"Evangelical Alliance"**. Never use
  "EA", "EAUK", "The Alliance" or any other iteration.
- Tone: engaging, discerning, credible, confident, compassionate, hopeful, creative.
- **Church**: lowercase `c` for denomination/institution/the local church; uppercase
  for individual church names (e.g. "St Mark's Church").
- **Bible**: capital B; lowercase for "biblical".
- **Rev**: "Rev", not "Rev'd"/"Revd"/"the Reverend".
- **Websites**: no `http://` prefix; no full stop after a URL.
- **Legal boilerplate** (must appear on all letters/emails/newsletters/website):
  "The Evangelical Alliance. A company limited by guarantee registered in England
  and Wales No. 123448. Registered Charity No England and Wales: 212325, Scotland:
  SC040576. Registered office: 176 Copenhagen Street, London, N1 0ST." This is
  already in the `.site-footer-legal` block — keep it intact.

### When adding UI

- Use the semantic tokens in `brand.css` (`--color-*`) rather than raw hex.
- Reuse the shared form/button/layout classes in `globals.css` (`.field`,
  `.button`, `.button-primary`, `.app-shell`, `.site-header`, `.site-footer`, etc.).
- Keep the footer legal boilerplate verbatim.
- Verify with `cmd /c "npm run typecheck"` and `cmd /c "npm run lint"`.

## Cookie consent (GDPR)

The app shows a GDPR cookie consent banner on every page. It is mounted once in
`app/layout.tsx` (inside `<body>`), so it appears across all routes.

- **Component**: `app/CookieConsent.tsx` — a client component using
  `useSyncExternalStore` (not `useState` + `useEffect`; the
  `react-hooks/set-state-in-effect` lint rule forbids synchronous `setState` in an
  effect). It reads/writes consent to `localStorage` under the key
  `ea-cookie-consent` as `{ essential, analytics }`.
- **Choices**: the first view offers "Accept all", "Reject all", and "Manage
  preferences". The preferences center keeps strictly necessary cookies enabled
  and lets visitors switch analytics cookies on or off, then accept all, reject
  all, or save their selection. The banner is hidden once a value is stored.
- **Policy page**: `app/cookies/page.tsx` — a static server component with the
  cookie policy content. The banner links to `/cookies`.
- **Styling**: `.cookie-consent` and `.cookie-policy` classes live in
  `globals.css`. The consent card uses the reference site's compact light panel
  layout and the Evangelical Alliance feature-dark text and button tokens.
- **Accessibility**: the banner is `role="dialog"` with `aria-modal="true"` and
  `aria-labelledby` pointing at its heading.
- **Hydration**: `getServerSnapshot` returns `null` (banner shown on first
  render), and the client snapshot reads `localStorage`. This is the same
  localStorage-backed pattern used by `lib/churchStore.ts`.
