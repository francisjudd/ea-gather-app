import { describe, expect, it } from 'vitest'
import { MAILTO_SAFE_LENGTH, buildGmailUrl, buildMailtoUrl, isMailtoTooLong } from '../mailto'

// Parse a mailto: URL back into decoded fields, the way a mail client would.
function parse(url: string) {
  const [head, query = ''] = url.replace(/^mailto:/, '').split('?')
  const fields: Record<string, string> = {}
  for (const pair of query.split('&').filter(Boolean)) {
    const eq = pair.indexOf('=')
    fields[pair.slice(0, eq)] = decodeURIComponent(pair.slice(eq + 1))
  }
  return { to: decodeURIComponent(head), fields }
}

describe('buildMailtoUrl', () => {
  it('builds a minimal link', () => {
    expect(buildMailtoUrl({ to: 'a@b.co' })).toBe('mailto:a@b.co')
  })

  it('keeps @ readable in every address field', () => {
    const url = buildMailtoUrl({ to: 'a@b.co', cc: 'c@d.co', bcc: 'e@f.co' })
    expect(url).toBe('mailto:a@b.co?cc=c@d.co&bcc=e@f.co')
  })

  it('joins multiple recipients with commas', () => {
    expect(buildMailtoUrl({ to: ['a@b.co', 'c@d.co'], cc: ['e@f.co', 'g@h.co'] })).toBe(
      'mailto:a@b.co,c@d.co?cc=e@f.co,g@h.co',
    )
  })

  it('allows an empty to', () => {
    expect(buildMailtoUrl({ to: '', subject: 'Hi' })).toBe('mailto:?subject=Hi')
    expect(buildMailtoUrl({ to: [], body: 'Hi' })).toBe('mailto:?body=Hi')
  })

  it('drops blank and empty addresses', () => {
    expect(buildMailtoUrl({ to: ['a@b.co', '', '  '], cc: '' })).toBe('mailto:a@b.co')
  })

  it('supports body-only and subject-only', () => {
    expect(buildMailtoUrl({ to: 'a@b.co', body: 'Hello' })).toBe('mailto:a@b.co?body=Hello')
    expect(buildMailtoUrl({ to: 'a@b.co', subject: 'Hello' })).toBe('mailto:a@b.co?subject=Hello')
  })

  it('omits empty subject and body', () => {
    expect(buildMailtoUrl({ to: 'a@b.co', subject: '', body: '' })).toBe('mailto:a@b.co')
  })

  describe('encoding', () => {
    it('encodes spaces as %20, never +', () => {
      const url = buildMailtoUrl({ to: 'a@b.co', subject: 'a b  c', body: 'x y' })
      expect(url).toBe('mailto:a@b.co?subject=a%20b%20%20c&body=x%20y')
      expect(url).not.toContain('+')
    })

    it('encodes a literal plus', () => {
      expect(buildMailtoUrl({ to: 'a@b.co', body: '1+1' })).toContain('body=1%2B1')
    })

    it('encodes reserved characters & # ? + % = "', () => {
      const text = 'a&b #c ?d +e 100% x=y "q"'
      const url = buildMailtoUrl({ to: 'a@b.co', subject: text, body: text })
      expect(url).toContain('subject=a%26b%20%23c%20%3Fd%20%2Be%20100%25%20x%3Dy%20%22q%22')
      // Only the structural ? and & remain
      expect(url.match(/\?/g)).toHaveLength(1)
      expect(url.match(/&/g)).toHaveLength(1)
      expect(url.match(/#/g)).toBeNull()
      expect(parse(url).fields).toEqual({ subject: text, body: text })
    })

    it("handles the apostrophe in St Mark's", () => {
      const url = buildMailtoUrl({ to: 'a@b.co', subject: "St Mark's Church" })
      expect(parse(url).fields.subject).toBe("St Mark's Church")
      expect(url).toContain("subject=St%20Mark's%20Church")
    })

    it('encodes unicode and emoji as UTF-8', () => {
      const text = 'Café – naïve “quotes” 🙏 £5 日本語'
      const url = buildMailtoUrl({ to: 'a@b.co', subject: text, body: text })
      expect(url).toContain('%F0%9F%99%8F')
      expect(url).toMatch(/^[\x20-\x7e]+$/)
      expect(parse(url).fields).toEqual({ subject: text, body: text })
    })

    it('encodes odd characters in an address instead of passing them through', () => {
      expect(buildMailtoUrl({ to: 'a b@c.co' })).toBe('mailto:a%20b@c.co')
      expect(buildMailtoUrl({ to: 'a@b.co?bcc=x@y.z' })).toBe('mailto:a@b.co%3Fbcc%3Dx@y.z')
    })

    it('trims addresses', () => {
      expect(buildMailtoUrl({ to: '  a@b.co ' })).toBe('mailto:a@b.co')
    })
  })

  describe('newlines in the body', () => {
    it.each([
      ['LF', 'a\nb'],
      ['CRLF', 'a\r\nb'],
    ])('%s becomes %%0D%%0A', (_name, body) => {
      expect(buildMailtoUrl({ to: 'a@b.co', body })).toBe('mailto:a@b.co?body=a%0D%0Ab')
    })

    it('normalises a mixed body without doubling CRs', () => {
      const url = buildMailtoUrl({ to: 'a@b.co', body: 'a\nb\r\nc\n\nd' })
      expect(url).toBe('mailto:a@b.co?body=a%0D%0Ab%0D%0Ac%0D%0A%0D%0Ad')
      expect(url).not.toContain('%0D%0D')
    })

    it('round-trips the body exactly (modulo CRLF)', () => {
      const body = "Dear Sam,\n\n  Indented, with “quotes”, 🙏 & 100% of St Mark's.\n\nThanks\n"
      const decoded = parse(buildMailtoUrl({ to: 'a@b.co', body })).fields.body
      expect(decoded).toBe(body.replace(/\n/g, '\r\n'))
      expect(decoded.replace(/\r\n/g, '\n')).toBe(body)
    })

    it('turns a bare CR (classic Mac line ending) into %0D%0A', () => {
      expect(buildMailtoUrl({ to: 'a@b.co', body: 'a\rb' })).toBe('mailto:a@b.co?body=a%0D%0Ab')
      expect(buildMailtoUrl({ to: 'a@b.co', body: 'a\r\rb' })).toBe('mailto:a@b.co?body=a%0D%0A%0D%0Ab')
    })
  })

  describe('header injection', () => {
    it('flattens CR/LF in the subject', () => {
      const url = buildMailtoUrl({ to: 'a@b.co', subject: 'Hi\r\nBcc: x@y.z' })
      expect(url).not.toMatch(/%0[DA]/i)
      expect(parse(url).fields).toEqual({ subject: 'Hi Bcc: x@y.z' })
      expect(url).not.toContain('bcc=')
    })

    it('flattens CR/LF in to and cc', () => {
      const url = buildMailtoUrl({
        to: 'a@b.co\r\nBcc: x@y.z',
        cc: ['c@d.co\nSubject: pwned', 'e@f.co\r'],
      })
      expect(url).not.toMatch(/%0[DA]/i)
      expect(url.match(/\?/g)).toHaveLength(1)
      expect(Object.keys(parse(url).fields)).toEqual(['cc'])
    })

    it('flattens CR/LF in bcc', () => {
      expect(buildMailtoUrl({ to: 'a@b.co', bcc: 'x@y.z\r\nTo: z@z.z' })).not.toMatch(/%0[DA]/i)
    })

    it('cannot smuggle extra parameters through a field', () => {
      const url = buildMailtoUrl({ to: 'a@b.co&bcc=x@y.z', subject: 'x&bcc=x@y.z', body: 'x&bcc=x@y.z' })
      expect(url.match(/&/g)).toHaveLength(1)
      expect(Object.keys(parse(url).fields)).toEqual(['subject', 'body'])
    })
  })

  it('treats a comma-separated string as several addresses', () => {
    expect(buildMailtoUrl({ to: 'a@b.co,c@d.co', cc: 'e@f.co, g@h.co,' })).toBe(
      'mailto:a@b.co,c@d.co?cc=e@f.co,g@h.co',
    )
  })
})

describe('isMailtoTooLong', () => {
  it('is false at the limit and true one past it', () => {
    expect(isMailtoTooLong('x'.repeat(MAILTO_SAFE_LENGTH))).toBe(false)
    expect(isMailtoTooLong('x'.repeat(MAILTO_SAFE_LENGTH + 1))).toBe(true)
  })

  it('measures the encoded URL, so encoding can push a body over', () => {
    const body = ' '.repeat(MAILTO_SAFE_LENGTH / 3) // 3 chars each once encoded
    expect(body.length).toBeLessThan(MAILTO_SAFE_LENGTH)
    expect(isMailtoTooLong(buildMailtoUrl({ to: 'a@b.co', body }))).toBe(true)
  })
})

describe('buildGmailUrl', () => {
  it('uses su for the subject and plain LF newlines', () => {
    expect(buildGmailUrl({ to: 'a@b.co', cc: 'c@d.co', subject: "St Mark's", body: 'a\r\nb\nc\rd' })).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=a@b.co&cc=c@d.co&su=St%20Mark's&body=a%0Ab%0Ac%0Ad",
    )
  })

  it('works with no fields and strips header injection', () => {
    expect(buildGmailUrl({ to: [] })).toBe('https://mail.google.com/mail/?view=cm&fs=1')
    expect(buildGmailUrl({ to: 'a@b.co', subject: 'Hi\r\nBcc: x', bcc: 'x@y.z' })).toBe(
      'https://mail.google.com/mail/?view=cm&fs=1&to=a@b.co&bcc=x@y.z&su=Hi%20Bcc%3A%20x',
    )
  })
})
