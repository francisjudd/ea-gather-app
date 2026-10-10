import { buildGmailUrl, type MailtoOptions } from '@/lib/messaging'

// Opens Gmail's web composer in a new tab, for people without a desktop mail app.
export default function GmailButton({
  label = 'Open in Gmail',
  className = 'button button-secondary',
  disabled = false,
  onClick,
  ...mail
}: MailtoOptions & { label?: string; className?: string; disabled?: boolean; onClick?: () => void }) {
  const content = (
    <>
      {label}
      <span aria-hidden="true">↗</span>
    </>
  )
  if (disabled) {
    return (
      <button className={className} type="button" disabled>
        {content}
      </button>
    )
  }
  return (
    <a className={className} href={buildGmailUrl(mail)} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {content}
    </a>
  )
}
