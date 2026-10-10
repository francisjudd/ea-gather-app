import type { LetterInput } from '../letter'

// A fully populated letter, in the style of the Putney example from the design work.
export const putney: LetterInput = {
  sender: {
    name: 'Jo Bennett',
    role: 'Community Outreach Lead',
    email: 'jo@stmarksputney.org',
    phone: '020 7946 0000',
  },
  church: {
    name: "St Mark's Putney",
    address: '1 High Street, London',
    postcode: 'SW15 1AA',
    area: 'Putney',
  },
  mp: {
    display_name: 'Sarah Whitfield MP',
    first_name: 'Sarah',
    email: 'sarah.whitfield.mp@parliament.uk',
    constituency: 'Putney',
  },
  activities: [
    { name: 'Food bank', days: 'each Tuesday', count: 40, unit: 'people', partner: 'Trussell' },
    { name: 'Warm space', days: 'weekdays', count: 25, unit: 'visitors' },
    { name: 'Debt advice', days: 'fortnightly', count: null, unit: 'people', partner: 'StepChange' },
  ],
  totals: { people_per_week_text: 'around 120 people' },
  message: {
    personal_note: '  Last winter a family told us the warm space "saved Christmas".  ',
    include_prayer_line: true,
    mention_evangelical_alliance: true,
  },
  constituency_rollup: {
    church_count: 7,
    activity_count: 31,
    rollup_url: 'https://example.org/putney?a=1&b=2',
  },
  outcome: { type: 'visit_photo', details: { activity: 'food bank', day: 'Tuesday' } },
}

// Only the required fields; every optional one is missing.
export const lean: LetterInput = {
  sender: { name: 'Jo Bennett' },
  church: { name: 'Grace Church', postcode: 'SW15 1AA' },
  mp: { display_name: 'Sarah Whitfield MP', email: 'sarah@parliament.uk', constituency: 'Putney' },
  activities: [{ name: 'Food bank' }],
  outcome: { type: 'keep_informed' },
}
