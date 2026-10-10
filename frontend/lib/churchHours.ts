// Structured opening hours for the public church directory (PUB-01).
// Each church stores its hours as a free-text string like "Sun 9am, 11am & 6pm" or
// "Sun 10:30am & 6:30pm; Wed 7:30pm". These helpers turn that into structured
// day-by-day entries so the directory can filter "when they're open".

export const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export type DayKey = (typeof dayKeys)[number]

export const dayLabels: Record<DayKey, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
}

export const dayShortLabels: Record<DayKey, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
}

export type ChurchHoursEntry = {
  day: DayKey
  times: string
}

const DAY_TOKEN = /^(sun|mon|tue|wed|thu|fri|sat)/i

/**
 * Parse a free-text operating-hours string into structured day/times entries.
 * Split on ";" because each church lists each open day as its own segment.
 */
export function parseChurchHours(hours: string): ChurchHoursEntry[] {
  const entries: ChurchHoursEntry[] = []
  for (const raw of hours.split(';')) {
    const part = raw.trim()
    const match = part.match(DAY_TOKEN)
    if (!match) continue
    const day = match[1].toLocaleLowerCase('en-GB') as DayKey
    const times = part
      .slice(match[0].length)
      .replace(/^[\s,&-]+/, '')
      .replace(/^[&&]+/, '')
      .trim()
    entries.push({ day, times })
  }
  return entries
}

/**
 * The set of days a church is open, as DayKey values.
 */
export function openDaysOf(hours: string): DayKey[] {
  return parseChurchHours(hours).map((entry) => entry.day)
}
