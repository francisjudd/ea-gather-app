import styles from './churches.module.css'

type Church = {
  id: string
  name: string
  address: string
  place: string
  lat: number
  lng: number
  denomination: string
  operatingHours: string
  verified: boolean
  initiatives: string[]
}

const initiativeLabels: Record<string, string> = {
  'food-bank': 'Food bank or food pantry',
  'warm-space': 'Warm space / community lounge',
  'debt-advice': 'Debt advice & financial wellbeing',
  'clothing-bank': 'Clothing or baby bank',
  'family-groups': 'Parent / toddler & family groups',
  'youth': 'Youth clubs or mentoring',
  'holiday-clubs': 'Holiday clubs / school-holiday meals',
  'schools': 'Schools work or chaplaincy',
  'older-people': "Older people's lunches & visits",
  'mental-health': 'Mental health support groups',
  'esol': 'ESOL classes / refugee support',
  'recovery': 'Recovery / addiction support',
  'prison': 'Prison visiting or chaplaincy',
  'street-pastors': 'Street pastors or homelessness outreach',
  'community-groups': 'Hosting community groups in our building',
  'eco-church': 'Environmental / Eco Church work',
}

function VerifiedBadge() {
  return (
    <span className={styles.verifiedBadge}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="m5 10 3 3 7-7" />
      </svg>
      Verified
    </span>
  )
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export default function ChurchProfileCard({ church }: { church: Church }) {
  return (
    <article className={styles.profileCard} aria-label={`${church.name} profile`}>
      <div className={styles.profileHeader}>
        <div>
          <h3>{church.name}</h3>
          <p className={styles.profileMeta}>
            {church.denomination}
            <span className={styles.profileMetaDot} aria-hidden="true">·</span>
            {church.place}
          </p>
        </div>
        {church.verified && <VerifiedBadge />}
      </div>

      <p className={styles.profileAddress}>{church.address}</p>

      <div className={styles.profileHours}>
        <ClockIcon />
        <span>{church.operatingHours}</span>
      </div>

      <div className={styles.profileSection}>
        <span className={styles.profileSectionLabel}>Community initiatives</span>
        <ul className={styles.profileInitiatives}>
          {church.initiatives.map((id) => (
            <li key={id}>{initiativeLabels[id] ?? id}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}
