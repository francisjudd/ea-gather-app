import { describe, expect, it } from 'vitest'
import { toLetterInput, type Draft } from '../draft'
import { renderLetterFallback } from '../letter'

const emptyDraft: Draft = {
  postcode: '',
  mpName: '',
  mpParty: '',
  mpEmail: '',
  churchName: '',
  denomination: '',
  attendance: '',
  churchAddress: '',
  senderName: '',
  senderRole: '',
  senderEmail: '',
  selectedActivities: [],
  activityCounts: {},
  personalNote: '',
  advocacyFollowUp: false,
  monthlyUpdate: false,
  sendMethod: '',
}

const draft = (patch: Partial<Draft>): Draft => ({ ...emptyDraft, ...patch })

describe('toLetterInput', () => {
  it('maps an empty draft to safe defaults', () => {
    expect(toLetterInput(emptyDraft)).toEqual({
      sender: { name: '', role: null, email: null },
      church: { name: 'our church', address: null, postcode: '' },
      mp: { display_name: 'there', first_name: null, email: '', constituency: '' },
      activities: [],
      message: { personal_note: '', include_prayer_line: true, mention_evangelical_alliance: false },
      outcome: { type: 'visit' },
    })
  })

  it('still renders a letter from an empty draft', () => {
    const { body } = renderLetterFallback(toLetterInput(emptyDraft))
    expect(body.startsWith('Dear there,\n\n')).toBe(true)
    expect(body).toContain('our church')
  })

  it('trims whitespace-only fields to their empty defaults', () => {
    const input = toLetterInput(
      draft({
        postcode: '  ',
        mpName: '   ',
        mpEmail: ' ',
        churchName: '  ',
        churchAddress: '\t',
        senderName: ' ',
        senderRole: '  ',
        senderEmail: '\n',
      }),
    )
    expect(input.sender).toEqual({ name: '', role: null, email: null })
    expect(input.church).toEqual({ name: 'our church', address: null, postcode: '' })
    expect(input.mp).toMatchObject({ display_name: 'there', first_name: null, email: '' })
  })

  it('trims populated fields', () => {
    const input = toLetterInput(
      draft({
        postcode: ' SW15 1AA ',
        mpName: '  Sarah   Whitfield ',
        mpEmail: ' s@parliament.uk ',
        churchName: " St Mark's ",
        churchAddress: ' 1 High St ',
        senderName: ' Jo ',
        senderRole: ' Pastor ',
        senderEmail: ' jo@x.org ',
      }),
    )
    expect(input.mp).toEqual({
      display_name: 'Sarah   Whitfield MP',
      first_name: 'Sarah',
      email: 's@parliament.uk',
      constituency: '',
    })
    expect(input.church).toEqual({ name: "St Mark's", address: '1 High St', postcode: 'SW15 1AA' })
    expect(input.sender).toEqual({ name: 'Jo', role: 'Pastor', email: 'jo@x.org' })
  })

  it('ignores the party and appends " MP" to the display name', () => {
    expect(toLetterInput(draft({ mpName: 'Sarah Whitfield', mpParty: 'Labour' })).mp.display_name).toBe(
      'Sarah Whitfield MP',
    )
  })

  describe('activities', () => {
    it('keeps the order of the activity list, not the order of selection', () => {
      const input = toLetterInput(draft({ selectedActivities: ['youth', 'food-bank', 'warm-space'] }))
      expect(input.activities.map((a) => a.name)).toEqual([
        'Food bank or food pantry',
        'Warm space / community lounge',
        'Youth clubs or mentoring',
      ])
    })

    it('ignores unknown ids and duplicates', () => {
      const input = toLetterInput(draft({ selectedActivities: ['nope', 'food-bank', 'food-bank'] }))
      expect(input.activities).toHaveLength(1)
    })

    it('carries the default frequency as days, or null', () => {
      const input = toLetterInput(draft({ selectedActivities: ['food-bank', 'warm-space'] }))
      expect(input.activities.map((a) => a.days)).toEqual(['each week', null])
    })

    it('always uses "people" as the unit', () => {
      const input = toLetterInput(draft({ selectedActivities: ['food-bank'], activityCounts: { 'food-bank': '30' } }))
      expect(input.activities[0]).toEqual({ name: 'Food bank or food pantry', days: 'each week', count: 30, unit: 'people' })
    })

    it.each([
      ['30', 30],
      [' 30 ', 30],
      ['2.5', null],
      ['1e2', 100],
      ['', null],
      ['  ', null],
      ['abc', null],
      ['12abc', null],
      ['0', null],
      ['-5', null],
      ['-0', null],
      ['Infinity', null],
      ['NaN', null],
    ])('count %j becomes %j', (typed, expected) => {
      const input = toLetterInput(
        draft({ selectedActivities: ['food-bank'], activityCounts: { 'food-bank': typed } }),
      )
      expect(input.activities[0].count).toBe(expected)
    })

    it('has a null count when none was typed', () => {
      expect(toLetterInput(draft({ selectedActivities: ['youth'] })).activities[0].count).toBeNull()
    })

    it('ignores counts for activities that are not selected', () => {
      const input = toLetterInput(draft({ selectedActivities: ['youth'], activityCounts: { 'food-bank': '30' } }))
      expect(input.activities).toHaveLength(1)
      expect(input.activities[0].count).toBeNull()
    })

    it('can select more than the letter will show (the letter caps at 5)', () => {
      const ids = ['food-bank', 'warm-space', 'debt-advice', 'clothing-bank', 'family-groups', 'youth', 'schools']
      const input = toLetterInput(draft({ selectedActivities: ids }))
      expect(input.activities).toHaveLength(7)
      const lines = renderLetterFallback(input).body.split('\n').filter((l) => l.startsWith('- '))
      expect(lines).toHaveLength(5)
    })
  })

  describe('message', () => {
    it('maps advocacyFollowUp to the Evangelical Alliance paragraph', () => {
      expect(toLetterInput(draft({ advocacyFollowUp: true })).message?.mention_evangelical_alliance).toBe(true)
      expect(toLetterInput(draft({ advocacyFollowUp: false })).message?.mention_evangelical_alliance).toBe(false)
      expect(renderLetterFallback(toLetterInput(draft({ advocacyFollowUp: true }))).body).toContain(
        'Evangelical Alliance',
      )
      expect(renderLetterFallback(toLetterInput(draft({ advocacyFollowUp: false }))).body).not.toContain(
        'Evangelical Alliance',
      )
    })

    it('ignores monthlyUpdate', () => {
      expect(toLetterInput(draft({ monthlyUpdate: true }))).toEqual(toLetterInput(draft({ monthlyUpdate: false })))
    })

    it('always includes the prayer line', () => {
      expect(toLetterInput(emptyDraft).message?.include_prayer_line).toBe(true)
    })

    it('passes the personal note through untrimmed (the letter trims it)', () => {
      const note = '  Hello\n\nthere  '
      expect(toLetterInput(draft({ personalNote: note })).message?.personal_note).toBe(note)
      expect(renderLetterFallback(toLetterInput(draft({ personalNote: note }))).body).toContain('\nHello\n\nthere\n')
    })
  })

  it('always asks for a visit', () => {
    expect(toLetterInput(emptyDraft).outcome).toEqual({ type: 'visit' })
  })

  it('sends the sender email to cc, not the letter body', () => {
    const input = toLetterInput(draft({ senderEmail: 'jo@x.org' }))
    expect(renderLetterFallback(input).body).not.toContain('jo@x.org')
  })
})
