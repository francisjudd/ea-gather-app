// Sample area data for the "Your area" church-leader dashboard.
//
// This mirrors the sample-data approach used in app/churches (a small, realistic
// dataset so the UI can be previewed without a live backend). The backend
// (backend/openapi.yaml) has no endpoints yet; replace these constants with API
// data once a constituency/social-action feed exists.

export type CategoryId = 'practical' | 'youth' | 'wellbeing' | 'vulnerable' | 'environment'

export type ArmyActivity = {
  id: string
  label: string
  category: CategoryId
}

export type ChurchProject = {
  activityId: string
  reach: number // estimated people reached each week (approximate)
  frequency: string // human-readable cadence, e.g. 'each week', 'fortnightly'
}

export type AreaChurch = {
  id: string
  name: string
  postcode: string
  denomination: string
  attendance: number // approximate weekly attendance
  projects: ChurchProject[]
}

export const activityCatalog: Record<string, ArmyActivity> = {
  'food-bank': { id: 'food-bank', label: 'Food bank or food pantry', category: 'practical' },
  'community-meals': { id: 'community-meals', label: 'Community meals or lunch club', category: 'practical' },
  'warm-space': { id: 'warm-space', label: 'Warm space / community lounge', category: 'practical' },
  'debt-advice': { id: 'debt-advice', label: 'Debt advice & financial wellbeing', category: 'practical' },
  'clothing-bank': { id: 'clothing-bank', label: 'Clothing or baby bank', category: 'practical' },
  'community-groups': { id: 'community-groups', label: 'Hosting community groups in our building', category: 'practical' },
  'family-groups': { id: 'family-groups', label: 'Parent / toddler & family groups', category: 'youth' },
  'youth': { id: 'youth', label: 'Youth clubs or mentoring', category: 'youth' },
  'holiday-clubs': { id: 'holiday-clubs', label: 'Holiday clubs / school-holiday meals', category: 'youth' },
  'schools': { id: 'schools', label: 'Schools work or chaplaincy', category: 'youth' },
  'tutoring': { id: 'tutoring', label: 'Homework or tutoring support', category: 'youth' },
  'older-people': { id: 'older-people', label: "Older people's lunches & visits", category: 'wellbeing' },
  'mental-health': { id: 'mental-health', label: 'Mental health support groups', category: 'wellbeing' },
  'bereavement': { id: 'bereavement', label: 'Bereavement support', category: 'wellbeing' },
  'esol': { id: 'esol', label: 'ESOL classes / refugee support', category: 'vulnerable' },
  'recovery': { id: 'recovery', label: 'Recovery / addiction support', category: 'vulnerable' },
  'prison': { id: 'prison', label: 'Prison visiting or chaplaincy', category: 'vulnerable' },
  'street-pastors': { id: 'street-pastors', label: 'Street pastors or homelessness outreach', category: 'vulnerable' },
  'eco-church': { id: 'eco-church', label: 'Environmental / Eco Church work', category: 'environment' },
  'gardening': { id: 'gardening', label: 'Community gardening / allotments', category: 'environment' },
}

export const categoryLabels: { id: CategoryId; label: string }[] = [
  { id: 'practical', label: 'Practical support' },
  { id: 'youth', label: 'Families & young people' },
  { id: 'wellbeing', label: 'Wellbeing & community' },
  { id: 'vulnerable', label: 'Vulnerable & marginalised people' },
  { id: 'environment', label: 'Community & wider social action' },
]

export type SampleArea = {
  constituency: string
  postcode: string
  mpName: string
  mpEmail: string
  churches: AreaChurch[]
}

export const sampleAreas: SampleArea[] = [
  {
    constituency: 'Doncaster Central',
    postcode: 'DN1 3LN',
    mpName: 'Sarah Whitfield',
    mpEmail: 'sarah.whitfield.mp@parliament.uk',
    churches: [
      {
        id: 'st-marks',
        name: "St Mark's Doncaster",
        postcode: 'DN1 3LN',
        denomination: 'Church of England',
        attendance: 180,
        projects: [
          { activityId: 'food-bank', reach: 60, frequency: 'each week' },
          { activityId: 'community-meals', reach: 35, frequency: 'each week' },
          { activityId: 'family-groups', reach: 35, frequency: 'each week' },
          { activityId: 'debt-advice', reach: 12, frequency: 'fortnightly' },
          { activityId: 'holiday-clubs', reach: 40, frequency: 'school holidays' },
        ],
      },
      {
        id: 'doncaster-vineyard',
        name: 'Doncaster Central Vineyard',
        postcode: 'DN4 5JH',
        denomination: 'Vineyard',
        attendance: 90,
        projects: [
          { activityId: 'warm-space', reach: 40, frequency: 'each week' },
          { activityId: 'youth', reach: 25, frequency: 'each week' },
          { activityId: 'mental-health', reach: 15, frequency: 'each week' },
          { activityId: 'bereavement', reach: 10, frequency: 'monthly' },
        ],
      },
      {
        id: 'wheatley-community',
        name: 'Wheatley Community Church',
        postcode: 'DN2 4DD',
        denomination: 'Independent',
        attendance: 70,
        projects: [
          { activityId: 'food-bank', reach: 45, frequency: 'each week' },
          { activityId: 'clothing-bank', reach: 20, frequency: 'each week' },
          { activityId: 'older-people', reach: 18, frequency: 'each week' },
          { activityId: 'gardening', reach: 14, frequency: 'each week' },
        ],
      },
      {
        id: 'st-james-balby',
        name: "St James' Balby",
        postcode: 'DN4 8SJ',
        denomination: 'Church of England',
        attendance: 140,
        projects: [
          { activityId: 'schools', reach: 120, frequency: 'term-time' },
          { activityId: 'street-pastors', reach: 10, frequency: 'each week' },
          { activityId: 'eco-church', reach: 25, frequency: 'each week' },
          { activityId: 'tutoring', reach: 16, frequency: 'term-time' },
        ],
      },
      {
        id: 'new-life-community',
        name: 'New Life Community Church',
        postcode: 'DN5 9NE',
        denomination: 'Independent',
        attendance: 55,
        projects: [
          { activityId: 'esol', reach: 30, frequency: 'each week' },
          { activityId: 'recovery', reach: 12, frequency: 'each week' },
          { activityId: 'community-groups', reach: 28, frequency: 'each week' },
          { activityId: 'warm-space', reach: 22, frequency: 'each week' },
        ],
      },
    ],
  },

  {
    constituency: 'Stockport',
    postcode: 'SK3 8HR',
    mpName: 'Navendu Mishra',
    mpEmail: 'navendu.mishra.mp@parliament.uk',
    churches: [
      {
        id: '360-life',
        name: '360 Life Church',
        postcode: 'SK3 8HR',
        denomination: 'Independent',
        attendance: 110,
        projects: [
          { activityId: 'food-bank', reach: 50, frequency: 'each week' },
          { activityId: 'debt-advice', reach: 14, frequency: 'fortnightly' },
          { activityId: 'youth', reach: 22, frequency: 'each week' },
          { activityId: 'holiday-clubs', reach: 35, frequency: 'school holidays' },
        ],
      },
      {
        id: '3c-community',
        name: '3c Community Church',
        postcode: 'SK4 5AA',
        denomination: 'Independent',
        attendance: 65,
        projects: [
          { activityId: 'warm-space', reach: 38, frequency: 'each week' },
          { activityId: 'community-groups', reach: 30, frequency: 'each week' },
          { activityId: 'older-people', reach: 16, frequency: 'each week' },
        ],
      },
    ],
  },
  {
    constituency: 'Cardiff Central',
    postcode: 'CF10 2FL',
    mpName: 'Kate Hollern',
    mpEmail: 'kate.hollern.mp@parliament.uk',
    churches: [
      {
        id: 'audacious-cardiff',
        name: '!Audacious Church – Cardiff',
        postcode: 'CF10 2FL',
        denomination: 'Independent',
        attendance: 220,
        projects: [
          { activityId: 'food-bank', reach: 70, frequency: 'each week' },
          { activityId: 'family-groups', reach: 40, frequency: 'each week' },
          { activityId: 'youth', reach: 35, frequency: 'each week' },
          { activityId: 'holiday-clubs', reach: 45, frequency: 'school holidays' },
        ],
      },
      {
        id: 'grangetown-church',
        name: 'Grangetown Baptist Church',
        postcode: 'CF11 6LQ',
        denomination: 'Baptist',
        attendance: 85,
        projects: [
          { activityId: 'esol', reach: 26, frequency: 'each week' },
          { activityId: 'street-pastors', reach: 12, frequency: 'each week' },
          { activityId: 'prison', reach: 9, frequency: 'monthly' },
        ],
      },
    ],
  },
]

// --- Aggregation helpers -----------------------------------------------------

const asNumber = (value: number): string => value.toLocaleString('en-GB')

export type AreaSummary = {
  churchCount: number
  totalAttendance: number
  projectCount: number
  totalReach: number
  byCategory: { id: CategoryId; label: string; count: number; reach: number }[]
  topProjects: { activityId: string; count: number; reach: number }[]
}

export function summarizeArea(churches: AreaChurch[]): AreaSummary {
  const byCategory = categoryLabels.map(({ id, label }) => {
    let count = 0
    let reach = 0
    churches.forEach((church) =>
      church.projects.forEach((project) => {
        const activity = activityCatalog[project.activityId]
        if (activity?.category === id) {
          count += 1
          reach += project.reach
        }
      }),
    )
    return { id, label, count, reach }
  })

  const projectMap = new Map<string, { activityId: string; count: number; reach: number }>()
  churches.forEach((church) =>
    church.projects.forEach((project) => {
      const entry = projectMap.get(project.activityId) ?? { activityId: project.activityId, count: 0, reach: 0 }
      entry.count += 1
      entry.reach += project.reach
      projectMap.set(project.activityId, entry)
    }),
  )

  const totalReach = churches.reduce(
    (sum, church) => sum + church.projects.reduce((inner, project) => inner + project.reach, 0),
    0,
  )
  const totalAttendance = churches.reduce((sum, church) => sum + church.attendance, 0)
  const projectCount = churches.reduce((sum, church) => sum + church.projects.length, 0)

  return {
    churchCount: churches.length,
    totalAttendance,
    projectCount,
    totalReach,
    byCategory,
    topProjects: [...projectMap.values()].sort((a, b) => b.reach - a.reach),
  }
}

// Letter-ready talking points derived from the aggregated data.
export function buildTalkingPoints(area: SampleArea | undefined, summary: AreaSummary): string[] {
  if (!area || summary.churchCount === 0) return []

  const points: string[] = [
    `${Math.round(summary.totalReach / summary.churchCount)} people are served by church projects in ${area.constituency} on an average week.`,
  ]

  const top = summary.topProjects[0]
  if (top) {
    const label = activityCatalog[top.activityId]?.label ?? 'community projects'
    points.push(`${summary.churchCount} churches here run ${summary.projectCount} social action projects between them — from ${label.toLowerCase()} to other local services.`)
  }

  const strongest = summary.byCategory.find((category) => category.reach === Math.max(...summary.byCategory.map((c) => c.reach)))
  if (strongest && strongest.reach > 0) {
    points.push(`The biggest area of impact is ${strongest.label.toLowerCase()}, reaching roughly ${asNumber(strongest.reach)} people each week.`)
  }

  const practical = summary.byCategory.find((category) => category.id === 'practical')
  if (practical && practical.count > 0) {
    points.push(`Members of the churches serve around ${asNumber(practical.reach)} people weekly through practical support such as food banks, warm spaces and debt advice.`)
  }

  points.push(`Many of these projects run on volunteer time from the congregation and cover gaps that public services increasingly struggle to reach.`)

  return points
}

export function formatReach(value: number): string {
  return asNumber(value)
}

