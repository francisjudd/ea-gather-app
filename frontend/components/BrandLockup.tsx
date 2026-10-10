/**
 * The Evangelical Alliance brand lockup shared across the site.
 *
 * This is the real logo artwork (see AGENTS.md): the lowercase "evangelical
 * alliance" wordmark, the "together making Jesus known" strapline, plus the
 * overlapping three-circle mark. Kept in one place so every header that renders
 * the logo (and any link to the site home) is identical to the demand-side header.
 *
 * Pass `size="sm"` for the compact footer variant.
 */
export default function BrandLockup({ size = 'md' }: { size?: 'md' | 'sm' }) {
  return (
    <span className={`ea-brand${size === 'sm' ? ' ea-brand--sm' : ''}`}>
      <img
        src="/ea-logo.svg"
        alt="Evangelical Alliance — together making Jesus known"
        className="ea-brand-img"
      />
    </span>
  )
}
