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

      I am the community Outreach Lead at St Mark's Putney (SW15 1AA), in Putney, and I am writing as one of your constituents.

      Each week we welcome around 120 people through our community activities:

      - Food bank: each Tuesday, around 40 people (with Trussell)
      - Warm space: weekdays, around 25 visitors
      - Debt advice: fortnightly (with StepChange)

      Last winter a family told us the warm space "saved Christmas".

      We are one of 7 churches in Putney running at least 31 community activities. You can see them all here: https://example.org/putney?a=1&b=2

      We would love you to visit our food bank on Tuesday, whenever suits you. It could also be a good moment for a photo with our volunteers.

      The Evangelical Alliance, which helps coordinate churches' engagement with Parliament, would welcome the chance to meet you and hear how churches in your constituency are supporting the community.

      Thank you for all you do for our community. We pray for you and your team regularly.

      With every good wish,
      Jo Bennett
      Community Outreach Lead
      St Mark's Putney
      1 High Street, London
      020 7946 0000"
    `)
  })

  it('renders a lean letter with every optional field missing', () => {
    expect(renderLetterFallback(lean).body).toMatchInlineSnapshot(`
      "Dear Sarah Whitfield MP,

      I am part of Grace Church (SW15 1AA), and I am writing as one of your constituents.

      - Food bank

      We would be glad to keep you updated on our work and to be a point of contact for you in the community.

      Thank you for all you do for our community.

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
    expect(withOutcome({ type: 'visit' })).toContain('We would love you to visit, whenever suits you.\n')
    expect(withOutcome({ type: 'visit', details: { activity: 'food bank', day: 'Tuesday' } })).toContain(
      'We would love you to visit our food bank on Tuesday, whenever suits you.\n',
    )
    expect(withOutcome({ type: 'visit', details: { day: 'Tuesday' } })).toContain(
      'visit on Tuesday, whenever',
    )
    expect(withOutcome({ type: 'visit' })).not.toContain('photo')
  })

  it('visit_photo adds the photo sentence', () => {
    const body = withOutcome({ type: 'visit_photo', details: { activity: 'food bank' } })
    expect(body).toContain(
      'We would love you to visit our food bank, whenever suits you. It could also be a good moment for a photo with our volunteers.',
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
      visit: 'We would love you to visit',
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
      .filter((l) => l.startsWith('- '))

  it('caps the list at 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `Activity ${i + 1}` }))
    expect(lines(many)).toEqual(['- Activity 1', '- Activity 2', '- Activity 3', '- Activity 4', '- Activity 5'])
    expect(render({ activities: many }, lean).body).not.toContain('Activity 6')
  })

  it('keeps exactly 5', () => {
    expect(lines(Array.from({ length: 5 }, (_, i) => ({ name: `A${i}` })))).toHaveLength(5)
  })

  it.each([
    ['name only', { name: 'Food bank' }, '- Food bank'],
    ['days', { name: 'Food bank', days: 'each Tuesday' }, '- Food bank: each Tuesday'],
    ['count', { name: 'Food bank', count: 40 }, '- Food bank: around 40'],
    ['count and unit', { name: 'Food bank', count: 40, unit: 'people' }, '- Food bank: around 40 people'],
    ['unit without count', { name: 'Food bank', unit: 'people' }, '- Food bank'],
    ['days and count', { name: 'Food bank', days: 'weekly', count: 40 }, '- Food bank: weekly, around 40'],
    [
      'days, count and unit',
      { name: 'Food bank', days: 'weekly', count: 40, unit: 'people' },
      '- Food bank: weekly, around 40 people',
    ],
    ['partner', { name: 'Food bank', partner: 'Trussell' }, '- Food bank (with Trussell)'],
    [
      'everything',
      { name: 'Food bank', days: 'weekly', count: 40, unit: 'people', partner: 'Trussell' },
      '- Food bank: weekly, around 40 people (with Trussell)',
    ],
    ['partner and count', { name: 'Food bank', count: 3, partner: 'Trussell' }, '- Food bank: around 3 (with Trussell)'],
    ['empty strings', { name: 'Food bank', days: '', unit: '', partner: '' }, '- Food bank'],
    ['null fields', { name: 'Food bank', days: null, count: null, unit: null, partner: null }, '- Food bank'],
  ])('formats %s', (_label, activity, expected) => {
    expect(lines([activity])).toEqual([expected])
  })

  it('treats count: null as no count', () => {
    expect(lines([{ name: 'Food bank', count: null, unit: 'people' }])).toEqual(['- Food bank'])
  })

  // KNOWN QUIRK: a zero count is falsy, so "around 0 people" is dropped as if no count was given.
  it('treats count: 0 as no count (known quirk)', () => {
    expect(lines([{ name: 'Food bank', count: 0, unit: 'people' }])).toEqual(['- Food bank'])
  })

  it('renders the totals line only when provided', () => {
    expect(putney.totals?.people_per_week_text).toBe('around 120 people')
    expect(render({}).body).toContain('Each week we welcome around 120 people through our community activities:')
    expect(render({ totals: {} }).body).not.toContain('Each week')
    expect(render({ totals: { people_per_week_text: null } }).body).not.toContain('Each week')
    expect(render({ totals: { people_per_week_text: '' } }).body).not.toContain('Each week')
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

  it('lower-cases the first letter of the role only', () => {
    const intro = (role?: string | null) =>
      render({ sender: { ...lean.sender, role } }, lean).body.split('\n')[2]
    expect(intro('Community Outreach Lead')).toContain('I am the community Outreach Lead at Grace Church')
    expect(intro('Pastor')).toContain('I am the pastor at Grace Church')
    expect(intro(undefined)).toContain('I am part of Grace Church')
    expect(intro(null)).toContain('I am part of Grace Church')
    expect(intro('')).toContain('I am part of Grace Church')
  })

  // Quirk: only the first character is lower-cased, giving "the community Outreach Lead".
  it.fails('lower-cases a multi-word role throughout', () => {
    const body = render({ sender: { ...lean.sender, role: 'Community Outreach Lead' } }, lean).body
    expect(body).toContain('I am the community outreach lead at Grace Church')
  })

  it('includes postcode and area in the intro when present', () => {
    expect(render({}).body).toContain("I am the community Outreach Lead at St Mark's Putney (SW15 1AA), in Putney, and")
    expect(render({ church: { ...putney.church, area: null } }).body).toContain('(SW15 1AA), and I am writing')
  })

  it('omits an empty postcode', () => {
    const body = render({ church: { name: 'Grace Church', postcode: '' } }, lean).body
    expect(body).toContain('part of Grace Church, and I am writing')
  })

  it('signs off with only the contact lines that exist', () => {
    expect(render({}).body.endsWith(
      "Jo Bennett\nCommunity Outreach Lead\nSt Mark's Putney\n1 High Street, London\n020 7946 0000",
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
      'Thank you for all you do for our community. We pray for you and your team regularly.\n',
    )
    for (const message of [{ include_prayer_line: false }, {}, undefined]) {
      const body = closing(message)
      expect(body).toContain('Thank you for all you do for our community.\n')
      expect(body).not.toContain('We pray')
    }
  })

  it('Evangelical Alliance paragraph on and off', () => {
    expect(closing({ mention_evangelical_alliance: true })).toContain('The Evangelical Alliance, which helps')
    for (const message of [{ mention_evangelical_alliance: false }, {}, undefined]) {
      expect(closing(message)).not.toContain('Evangelical Alliance')
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
      'data',
      'personal',
      'data',
      'outcome',
      'template',
      'data',
    ])
  })

  it('drops the empty segments from a lean letter', () => {
    expect(renderLetterFallback(lean).segments.map((s) => s.kind)).toEqual([
      'template',
      'data',
      'data',
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
      postcode: 'SW15 1AA', // empty place is covered separately below
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

  // The totals sentence introduces the list, so it only makes sense with activities (see quirk below).
  const inputs = Array.from({ length: 300 }, generate).map((input) =>
    input.activities.length ? input : { ...input, totals: undefined },
  )

  // Quirk: totals text with no activities leaves a dangling "...activities:" and a doubled blank line.
  it.fails('does not introduce an empty activity list', () => {
    const { body } = renderLetterFallback({ ...lean, activities: [], totals: { people_per_week_text: 'around 50 people' } })
    expect(body).not.toContain('activities:')
    expect(body).not.toMatch(/\n\n\n/)
  })

  // Quirk: with no area, constituency or postcode the activity subject ends in "in ".
  it.fails('does not leave a dangling "in" when there is no place', () => {
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
