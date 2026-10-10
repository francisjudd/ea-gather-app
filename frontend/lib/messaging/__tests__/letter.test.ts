import { describe, expect, it } from 'vitest'
import { buildLetterMailto, renderLetterFallback, type LetterInput } from '../letter'
import { lean, putney } from './fixtures'

const render = (patch: Partial<LetterInput> | ((base: LetterInput) => LetterInput), base = putney) =>
  renderLetterFallback(typeof patch === 'function' ? patch(base) : { ...base, ...patch })

const withOutcome = (outcome: LetterInput['outcome'], base = lean) => render({ outcome }, base).body

describe('full letter', () => {
  it('renders the Putney example', () => {
    expect(renderLetterFallback(putney).body).toMatchInlineSnapshot(`
      "Dear Sarah,

      I'm writing as Community Outreach Lead at St Mark's Putney, a church in your constituency.

      I wanted to share a brief picture of what we do in Putney week-to-week in case it's useful as you represent us in parliament.

      Each week, our team and volunteers run:
      * Food bank — around 40 people, each Tuesday (with Trussell)
      * Warm space — around 25 visitors, weekdays
      * Debt advice — fortnightly (with StepChange)

      Last winter a family told us the warm space "saved Christmas".

      We are one of 7 churches in Putney running at least 31 community activities. You can see them all here: https://example.org/putney?a=1&b=2

      The Evangelical Alliance, who help coordinate UK churches' engagement with parliament, would welcome the chance to meet with you and discuss how churches in your constituency are supporting the community. If that's something you'd be open to, you can contact them on advocacy@eauk.org.

      Thank you for the work you do for our area. We pray for you and your team regularly.

      We'd love to host you at our food bank on Tuesday at a time that suited you. It could also be a good moment for a photo with our volunteers.

      With every good wish,
      Jo Bennett
      Community Outreach Lead, St Mark's Putney
      1 High Street, London
      020 7946 0000"
    `)
  })

  it('renders a lean letter with every optional field missing', () => {
    expect(renderLetterFallback(lean).body).toMatchInlineSnapshot(`
      "Dear Sarah Whitfield MP,

      I'm writing from Grace Church, a church in your constituency.

      I wanted to share a brief picture of what we do in Putney week-to-week in case it's useful as you represent us in parliament.

      Each week, our team and volunteers run:
      * Food bank

      Thank you for the work you do for our area.

      We would be glad to keep you updated on our work and to be a point of contact for you in the community.

      With every good wish,
      Jo Bennett
      Grace Church"
    `)
  })

  it('renders the subjects', () => {
    expect(renderLetterFallback(putney).subjects).toMatchInlineSnapshot(`
      [
        "Invitation to visit St Mark's Putney, Putney",
        "Food bank in Putney",
      ]
    `)
    expect(renderLetterFallback(lean).subjects).toMatchInlineSnapshot(`
      [
        "Invitation to visit Grace Church",
        "Food bank in Putney",
      ]
    `)
  })
})

describe('outcomes', () => {
  it('visit', () => {
    expect(withOutcome({ type: 'visit' })).toContain("We'd love to host you at our church at a time that suited you.\n")
    expect(withOutcome({ type: 'visit', details: { activity: 'food bank', day: 'Tuesday' } })).toContain(
      "We'd love to host you at our food bank on Tuesday at a time that suited you.\n",
    )
    expect(withOutcome({ type: 'visit', details: { day: 'Tuesday' } })).toContain(
      'our church on Tuesday at a time',
    )
    expect(withOutcome({ type: 'visit' })).not.toContain('photo')
  })

  it('visit_photo adds the photo sentence', () => {
    const body = withOutcome({ type: 'visit_photo', details: { activity: 'food bank' } })
    expect(body).toContain(
      "We'd love to host you at our food bank at a time that suited you. It could also be a good moment for a photo with our volunteers.",
    )
  })

  it('missed_anything', () => {
    expect(withOutcome({ type: 'missed_anything' })).toContain('whether your office sees needs in your casework')
  })

  it('signposting', () => {
    expect(withOutcome({ type: 'signposting' })).toContain('share our services with your constituency caseworkers')
  })

  describe('meeting', () => {
    it('without availability', () => {
      expect(withOutcome({ type: 'meeting' })).toContain('to talk about our work.\n')
    })

    it('with availability', () => {
      expect(withOutcome({ type: 'meeting', details: { availability: 'Fridays are best' } })).toContain(
        'to talk about our work. Fridays are best.\n',
      )
    })
  })

  it('keep_informed', () => {
    expect(withOutcome({ type: 'keep_informed' })).toContain('We would be glad to keep you updated')
  })

  it.each(['visit', 'visit_photo', 'missed_anything', 'signposting', 'meeting', 'keep_informed'] as const)(
    '%s produces exactly one outcome segment, and none of the others',
    (type) => {
      const { segments } = render({ outcome: { type } }, lean)
      expect(segments.filter((s) => s.kind === 'outcome')).toHaveLength(1)
    },
  )

  it('shows only the chosen outcome wording', () => {
    const markers: Record<string, string> = {
      visit: "We'd love to host you",
      missed_anything: 'whether your office sees needs',
      signposting: 'constituency caseworkers',
      meeting: 'short meeting',
      keep_informed: 'keep you updated',
    }
    for (const [type, marker] of Object.entries(markers)) {
      const body = withOutcome({ type: type as LetterInput['outcome']['type'] })
      for (const [other, text] of Object.entries(markers)) {
        expect(body.includes(text), `${type} vs ${other}`).toBe(type === other)
      }
      expect(marker).toBeTruthy()
    }
  })
})

describe('activities', () => {
  const lines = (activities: LetterInput['activities']) =>
    render({ activities }, lean)
      .body.split('\n')
      .filter((l) => l.startsWith('* '))

  it('caps the list at 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `Activity ${i + 1}` }))
    expect(lines(many)).toEqual(['* Activity 1', '* Activity 2', '* Activity 3', '* Activity 4', '* Activity 5'])
    expect(render({ activities: many }, lean).body).not.toContain('Activity 6')
  })

  it('keeps exactly 5', () => {
    expect(lines(Array.from({ length: 5 }, (_, i) => ({ name: `A${i}` })))).toHaveLength(5)
  })

  it.each([
    ['name only', { name: 'Food bank' }, '* Food bank'],
    ['days', { name: 'Food bank', days: 'each Tuesday' }, '* Food bank — each Tuesday'],
    ['count', { name: 'Food bank', count: 40 }, '* Food bank — around 40'],
    ['count and unit', { name: 'Food bank', count: 40, unit: 'people' }, '* Food bank — around 40 people'],
    ['unit without count', { name: 'Food bank', unit: 'people' }, '* Food bank'],
    ['days and count', { name: 'Food bank', days: 'weekly', count: 40 }, '* Food bank — around 40, weekly'],
    [
      'days, count and unit',
      { name: 'Food bank', days: 'weekly', count: 40, unit: 'people' },
      '* Food bank — around 40 people, weekly',
    ],
    ['partner', { name: 'Food bank', partner: 'Trussell' }, '* Food bank (with Trussell)'],
    [
      'everything',
      { name: 'Food bank', days: 'weekly', count: 40, unit: 'people', partner: 'Trussell' },
      '* Food bank — around 40 people, weekly (with Trussell)',
    ],
    ['partner and count', { name: 'Food bank', count: 3, partner: 'Trussell' }, '* Food bank — around 3 (with Trussell)'],
    ['empty strings', { name: 'Food bank', days: '', unit: '', partner: '' }, '* Food bank'],
    ['null fields', { name: 'Food bank', days: null, count: null, unit: null, partner: null }, '* Food bank'],
  ])('formats %s', (_label, activity, expected) => {
    expect(lines([activity])).toEqual([expected])
  })

  it('treats count: null as no count', () => {
    expect(lines([{ name: 'Food bank', count: null, unit: 'people' }])).toEqual(['* Food bank'])
  })

  it('keeps count: 0 rather than treating it as no count', () => {
    expect(lines([{ name: 'Food bank', count: 0, unit: 'people' }])).toEqual(['* Food bank — around 0 people'])
  })
})

describe('greeting and sender', () => {
  it('uses the first name', () => {
    expect(render({}).body.startsWith('Dear Sarah,\n\n')).toBe(true)
  })

  it('falls back to display_name when first_name is missing, null or empty', () => {
    for (const first_name of [undefined, null, '']) {
      const body = render({ mp: { ...lean.mp, first_name } }, lean).body
      expect(body.startsWith('Dear Sarah Whitfield MP,\n\n')).toBe(true)
    }
  })

  it('uses the role as written in the intro, or falls back to "from"', () => {
    const intro = (role?: string | null) =>
      render({ sender: { ...lean.sender, role } }, lean).body.split('\n')[2]
    expect(intro('Vicar')).toBe("I'm writing as Vicar at Grace Church, a church in your constituency.")
    expect(intro('Community Outreach Lead')).toContain("I'm writing as Community Outreach Lead at Grace Church")
    for (const role of [undefined, null, '']) {
      expect(intro(role)).toBe("I'm writing from Grace Church, a church in your constituency.")
    }
  })

  it('names the constituency in the overview, or falls back to "your constituency"', () => {
    expect(render({}).body).toContain('what we do in Putney week-to-week')
    expect(render({ mp: { ...putney.mp, constituency: '' } }).body).toContain(
      'what we do in your constituency week-to-week',
    )
  })

  it('signs off with only the contact lines that exist', () => {
    expect(render({}).body.endsWith(
      "Jo Bennett\nCommunity Outreach Lead, St Mark's Putney\n1 High Street, London\n020 7946 0000",
    )).toBe(true)
    expect(renderLetterFallback(lean).body.endsWith('With every good wish,\nJo Bennett\nGrace Church')).toBe(true)
  })

  it('does not put the sender email in the letter body', () => {
    expect(render({}).body).not.toContain('jo@stmarksputney.org')
  })
})

describe('closing paragraphs', () => {
  const closing = (message: LetterInput['message']) => render({ message }).body

  it('prayer line on and off', () => {
    expect(closing({ include_prayer_line: true })).toContain(
      'Thank you for the work you do for our area. We pray for you and your team regularly.\n',
    )
    for (const message of [{ include_prayer_line: false }, {}, undefined]) {
      const body = closing(message)
      expect(body).toContain('Thank you for the work you do for our area.\n')
      expect(body).not.toContain('We pray')
    }
  })

  it('Evangelical Alliance paragraph on and off', () => {
    const on = closing({ mention_evangelical_alliance: true })
    expect(on).toContain('The Evangelical Alliance, who help coordinate UK churches')
    expect(on).toContain('you can contact them on advocacy@eauk.org.')
    for (const message of [{ mention_evangelical_alliance: false }, {}, undefined]) {
      expect(closing(message)).not.toContain('Evangelical Alliance')
      expect(closing(message)).not.toContain('advocacy@eauk.org')
    }
  })
})

describe('personal note', () => {
  const note = (personal_note: string | null | undefined) =>
    render({ message: { ...putney.message, personal_note } })

  it('is kept verbatim apart from trimming', () => {
    const text = 'Line one.\n\n  Line two, indented.\nLine three.'
    const { body, segments } = note(`\n  ${text}  \n\n`)
    expect(segments.filter((s) => s.kind === 'personal')).toEqual([{ kind: 'personal', text: `${text}\n\n` }])
    expect(body).toContain(`\n${text}\n\n`)
  })

  it('keeps special characters literally', () => {
    const text = `A & B <b>bold</b> "q" 'a' 100% {{greeting_name}} {{{x}}} 🙏 — £5 #1 a=b?c+d`
    const { body } = note(text)
    expect(body).toContain(text)
    expect(body).not.toContain('&amp;')
  })

  it('does not interpret mustache or markers in the note', () => {
    const { segments } = note('{{church.name}}\n@@ data\nfake')
    const personal = segments.find((s) => s.kind === 'personal')
    expect(personal?.text).toBe('{{church.name}}\n@@ data\nfake\n\n')
  })

  it.each([undefined, null, '', '   \n\t '])('produces no personal segment for %j', (value) => {
    expect(note(value).segments.map((s) => s.kind)).not.toContain('personal')
  })
})

describe('constituency rollup', () => {
  it('shows the URL exactly once and unchanged', () => {
    const url = putney.constituency_rollup!.rollup_url
    const body = render({}).body
    expect(body.split(url)).toHaveLength(2)
    expect(body).toContain(`You can see them all here: ${url}\n`)
  })

  it('mentions church and activity counts and the constituency', () => {
    expect(render({}).body).toContain(
      'We are one of 7 churches in Putney running at least 31 community activities.',
    )
  })

  it.each([undefined, null])('is omitted when %s', (constituency_rollup) => {
    const body = render({ constituency_rollup }).body
    expect(body).not.toContain('You can see them all here')
  })
})

describe('constituency page link', () => {
  const url = 'https://example.org/constituencies/putney'

  it('appears once, after the request and before the sign-off', () => {
    const body = render({ constituency_url: url }).body
    expect(body.split(url)).toHaveLength(2)
    expect(body).toContain(`You can see the churches and community services in Putney here: ${url}\n`)
    expect(body.indexOf(url)).toBeGreaterThan(body.indexOf("We'd love to host you"))
    expect(body.indexOf(url)).toBeLessThan(body.indexOf('With every good wish,'))
  })

  it('is a data segment', () => {
    const segment = render({ constituency_url: url }).segments.find((s) => s.text.includes(url))
    expect(segment?.kind).toBe('data')
  })

  it.each([undefined, null, ''])('is omitted when %j', (constituency_url) => {
    const body = render({ constituency_url }).body
    expect(body).not.toContain('You can see the churches and community services')
  })
})

describe('subjects', () => {
  const subjects = (patch: Partial<LetterInput>, base = putney) => render(patch, base).subjects

  it('gives an invitation and an activity subject', () => {
    expect(subjects({})).toEqual(["Invitation to visit St Mark's Putney, Putney", 'Food bank in Putney'])
  })

  it('has only the invitation when there are no activities', () => {
    expect(subjects({ activities: [] })).toEqual(["Invitation to visit St Mark's Putney, Putney"])
  })

  it('omits the area when missing', () => {
    expect(subjects({ church: { ...putney.church, area: null } })[0]).toBe("Invitation to visit St Mark's Putney")
  })

  it('picks the place from area, then constituency, then postcode', () => {
    const place = (church: LetterInput['church'], constituency: string) =>
      subjects({ church, mp: { ...putney.mp, constituency } })[1]
    expect(place({ ...putney.church, area: 'Roehampton' }, 'Putney')).toBe('Food bank in Roehampton')
    expect(place({ ...putney.church, area: null }, 'Putney')).toBe('Food bank in Putney')
    expect(place({ ...putney.church, area: '' }, '')).toBe('Food bank in SW15 1AA')
  })

  it('clamps long subjects to 60 characters with an ellipsis', () => {
    const church = { ...putney.church, name: 'The Very Long Named Community Church of Saint Bartholomew' }
    const [subject] = subjects({ church })
    expect(subject).toHaveLength(60)
    expect(subject.endsWith('…')).toBe(true)
    expect(subject.startsWith('Invitation to visit The Very Long Named Community Church o')).toBe(true)
  })

  it('leaves a subject of exactly 60 characters alone', () => {
    const pad = 60 - 'Invitation to visit '.length
    const [subject] = subjects({ church: { ...lean.church, name: 'x'.repeat(pad) } }, lean)
    expect(subject).toHaveLength(60)
    expect(subject.endsWith('…')).toBe(false)
  })

  it('trims a space before the ellipsis rather than leaving "word …"', () => {
    const pad = 59 - 'Invitation to visit '.length - 1
    const [subject] = subjects({ church: { ...lean.church, name: `${'x'.repeat(pad)} yyyyyyyy` } }, lean)
    expect(subject.endsWith('x…')).toBe(true)
    expect(subject.length).toBeLessThan(60)
  })

  it('clamps the activity subject too', () => {
    const [, subject] = subjects({ activities: [{ name: 'A'.repeat(80) }] })
    expect(subject).toHaveLength(60)
    expect(subject.endsWith('…')).toBe(true)
  })

  it('does not escape special characters', () => {
    expect(subjects({ activities: [{ name: 'Tea & toast' }] })[1]).toBe('Tea & toast in Putney')
  })
})

describe('segments', () => {
  it('joins back to the body', () => {
    for (const input of [putney, lean]) {
      const { segments, body } = renderLetterFallback(input)
      expect(segments.map((s) => s.text).join('')).toBe(body)
    }
  })

  it('has the expected kinds in order for the full letter', () => {
    expect(renderLetterFallback(putney).segments.map((s) => s.kind)).toEqual([
      'template',
      'data',
      'template',
      'data',
      'personal',
      'data',
      'template',
      'outcome',
      'template',
      'data',
    ])
  })

  it('drops the empty segments from a lean letter', () => {
    expect(renderLetterFallback(lean).segments.map((s) => s.kind)).toEqual([
      'template',
      'data',
      'template',
      'data',
      'template',
      'outcome',
      'template',
      'data',
    ])
  })

  it('trims trailing whitespace from the final segment only', () => {
    const { segments } = renderLetterFallback(putney)
    expect(segments.at(-1)!.text.endsWith('\n')).toBe(false)
    expect(segments[0].text.endsWith('\n\n')).toBe(true)
  })
})

describe('invariants over generated inputs', () => {
  // Small deterministic generator: no extra dependency, reproducible failures.
  let seed = 42
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
  const maybe = <T,>(x: T) => (rnd() < 0.5 ? x : undefined)
  const types = ['visit', 'visit_photo', 'missed_anything', 'signposting', 'meeting', 'keep_informed'] as const

  const generate = (): LetterInput => ({
    sender: {
      name: pick(['Jo Bennett', 'A', 'Zoë O’Neil']),
      role: pick([undefined, null, '', 'Pastor', 'Vicar of St Mark’s', 'Community Outreach Lead']),
      email: pick([undefined, null, 'jo@x.org']),
      phone: pick([undefined, null, '', '020 7946 0000']),
    },
    church: {
      name: pick(['Grace Church', "St Mark's", 'A & B <Church>']),
      address: pick([undefined, null, '', '1 High Street']),
      postcode: pick(['SW15 1AA', '']),
      area: pick([undefined, null, '', 'Putney']),
    },
    mp: {
      display_name: pick(['Sarah Whitfield MP', 'there']),
      first_name: pick([undefined, null, '', 'Sarah']),
      email: 'mp@parliament.uk',
      constituency: pick(['Putney', '']),
    },
    activities: Array.from({ length: Math.floor(rnd() * 8) }, (_, i) => ({
      name: `Activity ${i}`,
      days: pick([undefined, null, '', 'weekly']),
      count: pick([undefined, null, 0, 1, 25]),
      unit: pick([undefined, null, '', 'people']),
      partner: pick([undefined, null, '', 'Trussell']),
    })),
    totals: maybe({ people_per_week_text: pick([undefined, null, '', 'around 50 people']) }),
    message: maybe({
      personal_note: pick([undefined, null, '', '  ', 'A note.\n\nSecond paragraph.  ']),
      include_prayer_line: pick([true, false, undefined]),
      mention_evangelical_alliance: pick([true, false, undefined]),
    }),
    constituency_rollup: pick([
      undefined,
      null,
      { church_count: 3, activity_count: 9, rollup_url: 'https://example.org/p?a=1&b=2' },
    ]),
    outcome: {
      type: pick(types),
      details: maybe({
        activity: pick([undefined, '', 'food bank']),
        day: pick([undefined, '', 'Tuesday']),
        availability: pick([undefined, '', 'Fridays']),
      }),
    },
  })

  const inputs = Array.from({ length: 300 }, generate)

  it('does not introduce an empty activity list', () => {
    const { body } = renderLetterFallback({ ...lean, activities: [], totals: { people_per_week_text: 'around 50 people' } })
    expect(body).not.toContain('activities:')
    expect(body).not.toMatch(/\n\n\n/)
  })

  it('does not leave a dangling "in" when there is no place', () => {
    const { subjects } = renderLetterFallback({
      ...lean,
      church: { ...lean.church, postcode: '' },
      mp: { ...lean.mp, constituency: '' },
    })
    expect(subjects[1]).toBe('Food bank')
  })

  it('never leaks undefined, null, template tags or empty brackets', () => {
    for (const input of inputs) {
      const { body, subjects } = renderLetterFallback(input)
      for (const text of [body, ...subjects]) {
        expect(text, JSON.stringify(input)).not.toMatch(/undefined|null|\{\{|\}\}|\(\)|\[object/)
      }
    }
  })

  it('never has doubled blank lines or trailing whitespace', () => {
    for (const input of inputs) {
      const { body } = renderLetterFallback(input)
      expect(body, JSON.stringify(input)).not.toMatch(/\n\n\n/)
      expect(body, JSON.stringify(input)).not.toMatch(/[ \t]+\n/)
      expect(body, JSON.stringify(input)).not.toMatch(/\s$/)
      expect(body).not.toMatch(/^\s/)
    }
  })

  it('always has sane subjects and segments', () => {
    for (const input of inputs) {
      const { body, segments, subjects } = renderLetterFallback(input)
      expect(segments.map((s) => s.text).join('')).toBe(body)
      expect(subjects.length).toBe(input.activities.length ? 2 : 1)
      for (const subject of subjects) {
        expect(subject.length).toBeLessThanOrEqual(60)
        expect(subject.trim()).toBe(subject)
      }
      expect(segments.filter((s) => s.kind === 'outcome')).toHaveLength(1)
    }
  })

  it('mentions the rollup URL at most once', () => {
    for (const input of inputs) {
      const url = input.constituency_rollup?.rollup_url
      const count = url ? renderLetterFallback(input).body.split(url).length - 1 : 0
      expect(count).toBe(url ? 1 : 0)
    }
  })
})

describe('buildLetterMailto', () => {
  it('addresses the MP and copies the sender', () => {
    expect(buildLetterMailto(putney, 'Hello', 'Body')).toBe(
      'mailto:sarah.whitfield.mp@parliament.uk?cc=jo@stmarksputney.org&subject=Hello&body=Body',
    )
  })

  it('omits cc when the sender has no email', () => {
    expect(buildLetterMailto(lean, 'Hello', 'Body')).toBe('mailto:sarah@parliament.uk?subject=Hello&body=Body')
    expect(buildLetterMailto({ ...lean, sender: { name: 'J', email: null } }, 's', 'b')).not.toContain('cc=')
  })
})
