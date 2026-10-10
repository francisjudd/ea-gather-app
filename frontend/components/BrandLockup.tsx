/**
 * The Evangelical Alliance brand lockup shared across the site.
 *
 * This is the text-based stand-in for the logo artwork (see AGENTS.md): the lowercase
 * "evangelical alliance" wordmark plus the overlapping three-circle mark. Kept in one
 * place so every header that renders the logo (and any link to the site home) is
 * identical to the demand-side header.
 */
export default function BrandLockup() {
  return (
    <span className="ea-brand">
      <span className="ea-brand-name">
        evangelical <strong>alliance</strong>
      </span>
      <span className="ea-brand-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  )
}
