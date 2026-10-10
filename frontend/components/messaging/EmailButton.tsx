import { buildMailtoUrl, type MailtoOptions } from '@/lib/messaging'

const icon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
)

// A plain <a href="mailto:…">: works without JavaScript and is announced as a link.
// `disabled` renders a real disabled button instead, since links can't be disabled.
export default function EmailButton({
  label = 'Open in my email app',
  className = 'button button-primary',
  disabled = false,
  onClick,
  ...mail
}: MailtoOptions & { label?: string; className?: string; disabled?: boolean; onClick?: () => void }) {
  if (disabled) {
    return (
      <button className={className} type="button" disabled>
        {icon}
        {label}
      </button>
    )
  }
  return (
    <a className={className} href={buildMailtoUrl(mail)} onClick={onClick}>
      {icon}
      {label}
    </a>
  )
}
