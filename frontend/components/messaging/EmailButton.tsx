import { buildMailtoUrl, type MailtoOptions } from '@/lib/messaging'

// A plain <a href="mailto:…">: works without JavaScript and is announced as a link.
export default function EmailButton({
  label = 'Open in my email app',
  className = 'button button-primary',
  ...mail
}: MailtoOptions & { label?: string; className?: string }) {
  return (
    <a className={className} href={buildMailtoUrl(mail)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
      {label}
    </a>
  )
}
