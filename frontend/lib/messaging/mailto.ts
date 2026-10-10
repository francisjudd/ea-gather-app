// Builds RFC 6068 mailto: links (and the Gmail web-compose equivalent).
// - encodeURIComponent (spaces as %20, never '+', which some clients show literally)
// - newlines normalised to CRLF (%0D%0A), as mail clients expect
// - CR/LF stripped from single-line fields to prevent header injection

export interface MailtoOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject?: string
  body?: string
}

// Browsers and mail clients start truncating or refusing somewhere past ~2000 chars.
export const MAILTO_SAFE_LENGTH = 2000

const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

// A string may hold several comma-separated addresses; an array is one address per item.
const encodeAddresses = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value : value ? value.split(',') : [])
    .map((address) => encodeURIComponent(singleLine(address)).replace(/%40/g, '@'))
    .filter(Boolean)
    .join(',')

export function buildMailtoUrl({ to, cc, bcc, subject, body }: MailtoOptions): string {
  const params: string[] = []
  const add = (key: string, value: string) => value && params.push(`${key}=${value}`)

  add('cc', encodeAddresses(cc))
  add('bcc', encodeAddresses(bcc))
  if (subject) add('subject', encodeURIComponent(singleLine(subject)))
  if (body) add('body', encodeURIComponent(body.replace(/\r\n|\r|\n/g, '\r\n')))

  return `mailto:${encodeAddresses(to)}${params.length ? `?${params.join('&')}` : ''}`
}

// Gmail web compose: https://mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…
// Same fields and encoding rules as mailto, but the subject key is `su`.
export function buildGmailUrl({ to, cc, bcc, subject, body }: MailtoOptions): string {
  const params = ['view=cm', 'fs=1']
  const add = (key: string, value: string) => value && params.push(`${key}=${value}`)

  add('to', encodeAddresses(to))
  add('cc', encodeAddresses(cc))
  add('bcc', encodeAddresses(bcc))
  if (subject) add('su', encodeURIComponent(singleLine(subject)))
  if (body) add('body', encodeURIComponent(body.replace(/\r\n|\r|\n/g, '\n')))

  return `https://mail.google.com/mail/?${params.join('&')}`
}

export const isMailtoTooLong = (url: string) => url.length > MAILTO_SAFE_LENGTH
