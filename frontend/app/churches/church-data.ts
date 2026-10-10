// Church-directory data shared by the finder (/churches) and the individual
// church profile view (/churches/[id]). The backend (/openapi/churches) is the
// source of truth; the profile extras (talking points, story, activities) are
// derived from the directory record so the page renders without hand-authored
// content.

import { openDaysOf, type DayKey } from '../../lib/churchHours'
import { api, type Church as ApiChurch } from '../../lib/api/client'

export type Church = ApiChurch

// The category palette extends the brand guidelines (see app/brand.css, section 4).
// These ids map onto the global .chip[data-cat="..."] colour tokens.
export type CategoryId = 'practical' | 'youth' | 'wellbeing' | 'vulnerable' | 'environment'

export const categoryLabels: Record<CategoryId, string> = {
  practical: 'Practical support',
  youth: 'Families & young people',
  wellbeing: 'Wellbeing & community',
  vulnerable: 'Vulnerable & marginalised people',
  environment: 'Community & wider social action',
}

export const churches: Church[] = []

// --- Rich profile view -------------------------------------------------------
// A church's "impact profile". The directory Church holds only the fields the
// finder needs; these extras drive the individual profile page. All fields have
// sensible fallbacks (see getChurchById) so the profile always renders.

export type TalkingPoint = {
  figure: string // headline figure, e.g. "320 people"
  label: string // short label, e.g. "served each week"
  text: string // one-sentence talking point
}

export type ChurchActivity = {
  id: string
  title: string
  category: CategoryId
  days: DayKey[]
  reach: number
  reachUnit: string // e.g. 'people a week', 'families a month'
}

export type ChurchStory = {
  quote: string
  author: string
  role: string
}

export type ChurchMp = {
  name: string
  party: string
  constituency: string
}

export type ChurchContact = {
  name: string
  address: string
  email: string
}

export type ChurchProfileExtras = {
  constituency: string
  attendance: number | null
  verifiedDate?: string
  reachPerWeek: number
  volunteerHoursYear: number
  daysOpenPerWeek: number
  talkingPoints: TalkingPoint[]
  activities: ChurchActivity[]
  story: ChurchStory
  mp: ChurchMp
  contact: ChurchContact
}

export type ChurchProfile = Church & ChurchProfileExtras & {
  projectCount: number
  daysOpenLabel: string
}

// Defaults for a single activity, keyed by the directory initiative id. Used to
// build a meaningful profile for any church that has not had rich data authored.
const activityDefaults: Record<string, { title: string; category: CategoryId }> = {
  foodbanks: { title: 'Food bank & pantry', category: 'practical' },
  'warm-spaces': { title: 'Warm space & community lounge', category: 'practical' },
  'debt-help': { title: 'Debt advice & financial wellbeing', category: 'practical' },
  'charity-shop': { title: 'Charity shop', category: 'practical' },
  'employment-service': { title: 'Employment service', category: 'practical' },
  'job-clubs': { title: 'Job clubs', category: 'practical' },
  'life-skills': { title: 'Life skills', category: 'practical' },
  'make-lunch': { title: 'Make Lunch', category: 'practical' },
  centre: { title: 'Community centre', category: 'practical' },
  'early-intervention': { title: 'Early intervention', category: 'youth' },
  'homelessness-service': { title: 'Homelessness service', category: 'vulnerable' },
  'older-people-service': { title: "Older people's service", category: 'wellbeing' },
  'salvation-army-church': { title: 'Salvation Army church', category: 'practical' },
}

// A light fallback story so un-authored churches still read as a real page.
const defaultStory: ChurchStory = {
  quote: 'We know the community around us, and we long to see it flourish. These projects are simply our way of loving our neighbours practically.',
  author: 'The leadership team',
  role: 'Prayerfully serving our community',
}

const defaultMp: ChurchMp = {
  name: 'Your local MP',
  party: '',
  constituency: 'your local constituency',
}

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// Build the "N / 7 days" phrase used in the profile hero.
function daysOpenLabel(count: number): string {
  return `${count} / 7 days`
}

// Minimal parse of an operating-hours string into the set of open days, used to
// provide a fallback for the "days open" figure; openDaysOf comes from lib/churchHours.
// Derive a fallback weekly-strip for an activity from the day keys it is open.
function orderDays(days: DayKey[]): DayKey[] {
  const set = new Set(days)
  return DAY_ORDER.filter((day) => set.has(day))
}

function buildFallbackActivities(initiatives: string[]): ChurchActivity[] {
  return initiatives.map((initiativeId, index) => {
    const spec = activityDefaults[initiativeId] ?? { title: initiativeId, category: 'practical' as CategoryId }
    const dayA = DAY_ORDER[index % DAY_ORDER.length]
    const dayB = DAY_ORDER[(index + 2) % DAY_ORDER.length]
    const days = orderDays(dayA === dayB ? [dayA] : [dayA, dayB])
    return {
      id: initiativeId,
      title: spec.title,
      category: spec.category,
      days,
      reach: 15 + index * 5,
      reachUnit: 'people a week',
    }
  })
}

// Merge a directory record with authored extras, filling any missing field from a
// reasonable default so the profile page always renders.
export function toChurchProfile(church: Church): ChurchProfile {
  const extras = churchProfiles[church.id]
  const activities = extras?.activities ?? buildFallbackActivities(church.initiatives)
  const attendance = extras?.attendance ?? null

  // Days the church is open, derived from the days its activities run; if no
  // activities have day data, fall back to the days parsed from operatingHours.
  const activityDays = [...new Set(activities.flatMap((activity) => activity.days))]
  const daysOpenPerWeek = Math.max(1, activityDays.length || openDaysOf(church.operatingHours).length)

  return {
    ...church,
    ...extras,
    activities,
    attendance,
    daysOpenPerWeek,
    constituency: extras?.constituency ?? church.constituency ?? church.place,
    reachPerWeek:
      extras?.reachPerWeek ?? activities.reduce((sum, activity) => sum + activity.reach, 0),
    volunteerHoursYear: extras?.volunteerHoursYear ?? ((attendance ?? 0) + 1) * 40,
    projectCount: activities.length,
    daysOpenLabel: daysOpenLabel(daysOpenPerWeek),
    talkingPoints: extras?.talkingPoints ?? [],
    story: extras?.story ?? defaultStory,
    mp: extras?.mp ?? defaultMp,
    contact: extras?.contact ?? {
      name: 'Church contact',
      address: church.address,
      email: '',
    },
  }
}

export async function getChurchById(id: string): Promise<ChurchProfile | undefined> {
  try {
    const church = await api.getChurch(id)
    return toChurchProfile(church)
  } catch {
    return undefined
  }
}

export async function getChurchIds(): Promise<string[]> {
  try {
    const churches = await api.listChurches({ limit: 5000 })
    return churches.map((church) => church.id)
  } catch {
    return []
  }
}

// Rich, hand-authored impact profiles keyed by church id. Where a church is not
// present, getChurchById fills in the gaps from the directory record.
const churchProfiles: Record<string, Omit<ChurchProfileExtras, 'daysOpenPerWeek'>> = {
  'audacious-salford': {
    constituency: 'Salford & Eccles',
    attendance: 1200,
    verifiedDate: 'Sep 2026',
    reachPerWeek: 480,
    volunteerHoursYear: 8200,
    talkingPoints: [
      { figure: '480 people', label: 'served each week', text: 'Across the week, food, warmth and a welcome reach roughly 480 people in Salford.' },
      { figure: '5 projects', label: 'running this year', text: 'A food bank, a warm space, youth work, community groups and Eco Church work run through the year.' },
      { figure: '6 / 7 days', label: 'the building is open', text: 'The building opens six days a week, so it is more than a church that meets on a Sunday.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['mon', 'tue', 'thu'], reach: 160, reachUnit: 'people a week' },
      { id: 'warm-space', title: 'Warm space & community lounge', category: 'practical', days: ['mon', 'tue', 'wed', 'thu', 'fri'], reach: 90, reachUnit: 'people a week' },
      { id: 'youth', title: 'Youth clubs & mentoring', category: 'youth', days: ['tue', 'thu'], reach: 70, reachUnit: 'young people a week' },
      { id: 'community-groups', title: 'Hosting community groups', category: 'practical', days: ['wed'], reach: 120, reachUnit: 'people a week' },
      { id: 'eco-church', title: 'Environmental / Eco Church work', category: 'environment', days: ['sun'], reach: 40, reachUnit: 'people a month' },
    ],
    story: {
      quote: 'We are one church in the middle of the city, and the city is our parish. Opening six days a week is simply who we are called to be.',
      author: 'Megan Rylance',
      role: 'Operations Director',
    },
    mp: { name: 'Rebecca Long-Bailey MP', party: 'Labour', constituency: 'Salford & Eccles' },
    contact: { name: 'Megan Rylance, Operations Director', address: 'Trinity Way, Salford, M3 7BB', email: 'hello@audacious.org.uk' },
  },
  'audacious-cardiff': {
    constituency: 'Cardiff South & Penarth',
    attendance: 650,
    verifiedDate: 'Aug 2026',
    reachPerWeek: 260,
    volunteerHoursYear: 4100,
    talkingPoints: [
      { figure: '260 people', label: 'served weekly', text: 'Food, family groups and youth work together reach about 260 people in Cardiff each week.' },
      { figure: '4 projects', label: 'running this year', text: 'A food bank, family groups, youth work and holiday clubs run across the week and school holidays.' },
      { figure: '5 / 7 days', label: 'the building is open', text: 'The building opens five days a week to serve families beyond the Sunday service.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['tue', 'fri'], reach: 110, reachUnit: 'people a week' },
      { id: 'family-groups', title: 'Parent / toddler & family groups', category: 'youth', days: ['mon', 'wed'], reach: 60, reachUnit: 'families a week' },
      { id: 'youth', title: 'Youth clubs & mentoring', category: 'youth', days: ['thu'], reach: 50, reachUnit: 'young people a week' },
      { id: 'holiday-clubs', title: 'Holiday clubs & school-holiday meals', category: 'youth', days: ['mon', 'tue', 'wed', 'thu', 'fri'], reach: 40, reachUnit: 'children in school holidays' },
    ],
    story: {
      quote: 'Families in this part of Cardiff know where to come when the school holidays stretch a household.',
      author: 'Dewi Morgan',
      role: 'Community Pastor',
    },
    mp: { name: 'Stephen Doughty MP', party: 'Labour', constituency: 'Cardiff South & Penarth' },
    contact: { name: 'Dewi Morgan, Community Pastor', address: 'Bute Terrace, Cardiff, CF10 2FL', email: 'hello@audaciouscardiff.org.uk' },
  },
  'audacious-chester': {
    constituency: 'City of Chester',
    attendance: 320,
    reachPerWeek: 130,
    volunteerHoursYear: 1900,
    talkingPoints: [
      { figure: '130 people', label: 'served each week', text: 'A warm space, debt advice and hosted community groups reach around 130 people in Chester each week.' },
      { figure: '3 projects', label: 'running this year', text: 'The church offers a warm welcome, debt advice and rooms for local community groups.' },
      { figure: '4 / 7 days', label: 'the building is open', text: 'The building opens four days a week, and on Sunday for the morning service.' },
    ],
    activities: [
      { id: 'warm-space', title: 'Warm space & community lounge', category: 'practical', days: ['mon', 'tue', 'wed', 'thu'], reach: 70, reachUnit: 'people a week' },
      { id: 'debt-advice', title: 'Debt advice & financial wellbeing', category: 'practical', days: ['wed'], reach: 15, reachUnit: 'households a week' },
      { id: 'community-groups', title: 'Hosting community groups', category: 'practical', days: ['tue', 'thu'], reach: 45, reachUnit: 'people a week' },
    ],
    story: {
      quote: 'Some of the people who walk in for warmth stay to talk, and some stay to volunteer. That is the best part.',
      author: 'Rev Joanne Price',
      role: 'Lead Pastor',
    },
    mp: { name: 'Samantha Dixon MP', party: 'Labour', constituency: 'City of Chester' },
    contact: { name: 'Rev Joanne Price, Lead Pastor', address: '4 Sovereign Way, Chester, CH1 4QN', email: 'hello@audaciouschester.org.uk' },
  },
  'audacious-bury': {
    constituency: 'Bury North',
    attendance: 900,
    verifiedDate: 'Jul 2026',
    reachPerWeek: 380,
    volunteerHoursYear: 6300,
    talkingPoints: [
      { figure: '380 people', label: 'served each week', text: 'Food, clothing, youth work and street outreach reach roughly 380 people in Bury each week.' },
      { figure: '4 projects', label: 'running this year', text: 'A food bank, a clothing bank, youth work and street pastors all run from the church.' },
      { figure: '5 / 7 days', label: 'the building is open', text: 'The building opens five days a week and on Sunday for services.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['mon', 'wed', 'fri'], reach: 140, reachUnit: 'people a week' },
      { id: 'clothing-bank', title: 'Clothing & baby bank', category: 'practical', days: ['tue', 'thu'], reach: 80, reachUnit: 'people a week' },
      { id: 'youth', title: 'Youth clubs & mentoring', category: 'youth', days: ['tue'], reach: 60, reachUnit: 'young people a week' },
      { id: 'street-pastors', title: 'Street pastors & outreach', category: 'vulnerable', days: ['sat'], reach: 100, reachUnit: 'people a week' },
    ],
    story: {
      quote: 'We have seen families come for a food parcel and come back to volunteer. The practical stuff builds the relationships.',
      author: 'Amy Fletcher',
      role: 'Community Minster',
    },
    mp: { name: 'James Daly MP', party: 'Conservative', constituency: 'Bury North' },
    contact: { name: 'Amy Fletcher, Community Minister', address: 'The Rock, Bury, BL9 0YB', email: 'hello@audaciousbury.org.uk' },
  },
  'audacious-sheffield': {
    constituency: 'Sheffield South East',
    attendance: 700,
    reachPerWeek: 210,
    volunteerHoursYear: 3200,
    talkingPoints: [
      { figure: '210 people', label: 'served each week', text: 'Food, a warm space, mental health support and recovery help reach around 210 people in Sheffield.' },
      { figure: '4 projects', label: 'running this year', text: 'The church runs a food bank, a warm space, a mental health group and recovery support.' },
      { figure: '5 / 7 days', label: 'the building is open', text: 'The building opens five days a week, serving the city beyond Sunday.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['tue', 'thu'], reach: 90, reachUnit: 'people a week' },
      { id: 'warm-space', title: 'Warm space & community lounge', category: 'practical', days: ['mon', 'fri'], reach: 50, reachUnit: 'people a week' },
      { id: 'mental-health', title: 'Mental health support group', category: 'wellbeing', days: ['wed'], reach: 30, reachUnit: 'people a week' },
      { id: 'recovery', title: 'Recovery & addictions support', category: 'vulnerable', days: ['thu'], reach: 40, reachUnit: 'people a week' },
    ],
    story: {
      quote: 'Addiction does not keep office hours and neither, it turns out, do our volunteers. We stay close to people on the journey.',
      author: 'Rev Tom Hesketh',
      role: 'Pastor',
    },
    mp: { name: 'Clive Betts MP', party: 'Labour', constituency: 'Sheffield South East' },
    contact: { name: 'Rev Tom Hesketh, Pastor', address: 'Victoria Quays, Sheffield, S4 7YA', email: 'hello@audacioussheffield.org.uk' },
  },
  '360-life': {
    constituency: 'Stockport',
    attendance: 180,
    reachPerWeek: 120,
    volunteerHoursYear: 1500,
    talkingPoints: [
      { figure: '120 people', label: 'served each week', text: 'A food bank, debt advice, youth work and holiday clubs reach about 120 people in Stockport.' },
      { figure: '4 projects', label: 'running this year', text: 'The church serves households, young people and families through the year.' },
      { figure: '4 / 7 days', label: 'the building is open', text: 'The life centre is open four days a week and on Sunday.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['mon', 'thu'], reach: 50, reachUnit: 'people a week' },
      { id: 'debt-advice', title: 'Debt advice & financial wellbeing', category: 'practical', days: ['wed'], reach: 12, reachUnit: 'households a week' },
      { id: 'youth', title: 'Youth clubs & mentoring', category: 'youth', days: ['tue'], reach: 30, reachUnit: 'young people a week' },
      { id: 'holiday-clubs', title: 'Holiday clubs & school-holiday meals', category: 'youth', days: ['mon', 'tue', 'wed', 'thu', 'fri'], reach: 30, reachUnit: 'children in school holidays' },
    ],
    story: {
      quote: 'You can drop in with an empty cupboard and leave with food and a way to think about the money. Both matter.',
      author: 'Nicky Booth',
      role: 'Life Centre Manager',
    },
    mp: { name: 'Lisa Smart MP', party: 'Liberal Democrat', constituency: 'Stockport' },
    contact: { name: 'Nicky Booth, Life Centre Manager', address: '71 Adswood Road, Stockport, SK3 8HR', email: 'hello@360life.org.uk' },
  },
  '3c-community': {
    constituency: 'Stockport',
    attendance: 90,
    reachPerWeek: 100,
    volunteerHoursYear: 950,
    talkingPoints: [
      { figure: '100 people', label: 'served each week', text: 'A warm space, hosted community groups and older people work reach around 100 people each week.' },
      { figure: '3 projects', label: 'running this year', text: 'The church opens its doors for warmth, community groups and older people through the week.' },
      { figure: '4 / 7 days', label: 'the building is open', text: 'The building is open four days a week and on Sunday.' },
    ],
    activities: [
      { id: 'warm-space', title: 'Warm space & community lounge', category: 'practical', days: ['mon', 'tue', 'thu'], reach: 40, reachUnit: 'people a week' },
      { id: 'community-groups', title: 'Hosting community groups', category: 'practical', days: ['wed'], reach: 35, reachUnit: 'people a week' },
      { id: 'older-people', title: "Older people's lunches & visits", category: 'wellbeing', days: ['tue'], reach: 25, reachUnit: 'people a week' },
    ],
    story: {
      quote: 'A hot room, a friendly table and time to listen. You would be surprised how much that helps in a hard week.',
      author: 'Pastor Daniel Okoye',
      role: 'Community Pastor',
    },
    mp: { name: 'Lisa Smart MP', party: 'Liberal Democrat', constituency: 'Stockport' },
    contact: { name: 'Pastor Daniel Okoye, Community Pastor', address: 'Stockport, Greater Manchester', email: 'hello@3ccommunity.org.uk' },
  },
  'abbey-chapel': {
    constituency: 'Example Central',
    attendance: 220,
    verifiedDate: 'Jun 2026',
    reachPerWeek: 150,
    volunteerHoursYear: 2000,
    talkingPoints: [
      { figure: '150 people', label: 'served each week', text: 'A food bank, clothing bank, prison visiting and street outreach reach around 150 people each week.' },
      { figure: '4 projects', label: 'running this year', text: 'The church serves households, people in prison and people out on the streets through the year.' },
      { figure: '4 / 7 days', label: 'the building is open', text: 'The building is open four days a week and on Sunday.' },
    ],
    activities: [
      { id: 'food-bank', title: 'Food bank & pantry', category: 'practical', days: ['tue', 'fri'], reach: 60, reachUnit: 'people a week' },
      { id: 'clothing-bank', title: 'Clothing & baby bank', category: 'practical', days: ['thu'], reach: 30, reachUnit: 'people a week' },
      { id: 'prison', title: 'Prison visiting & chaplaincy', category: 'vulnerable', days: ['wed'], reach: 20, reachUnit: 'people a week' },
      { id: 'street-pastors', title: 'Street pastors & outreach', category: 'vulnerable', days: ['sat'], reach: 40, reachUnit: 'people a week' },
    ],
    story: {
      quote: 'Some of the most faithful volunteers we have met through the food bank are people we first served. That is the same story turning round.',
      author: 'Rev Hannah Wells',
      role: 'Vicar',
    },
    mp: { name: 'Example MP', party: 'Independent', constituency: 'Example Central' },
    contact: { name: 'Rev Hannah Wells, Vicar', address: 'United Kingdom', email: 'hello@abbeychapel.org.uk' },
  },
}
