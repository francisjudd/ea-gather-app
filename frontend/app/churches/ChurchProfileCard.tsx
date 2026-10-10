import Link from 'next/link'
import { initiativeLabels } from '../../lib/initiatives'
import { dayLabels, parseChurchHours } from '../../lib/churchHours'
import { formatDistance } from '../../lib/geo'
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
  distanceMiles?: number
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
  const hours = parseChurchHours(church.operatingHours)

  return (
    <article className={styles.profileCard} aria-label={`${church.name} profile`}>
      <div className={styles.profileHeader}>
        <div>
          <Link href={`/churches/${church.id}`} className={styles.profileLink}>
            <h3>{church.name}</h3>
          </Link>
          <p className={styles.profileMeta}>
            {church.denomination}
            <span className={styles.profileMetaDot} aria-hidden="true">·</span>
            {church.place}
          </p>
        </div>
        <div className={styles.profileBadges}>
          {church.distanceMiles != null && (
            <span className={styles.distanceBadge} aria-label={`${church.distanceMiles.toFixed(1)} miles away`}>
              {formatDistance(church.distanceMiles)} away
            </span>
          )}
          {church.verified && <VerifiedBadge />}
        </div>
      </div>

      <p className={styles.profileAddress}>{church.address}</p>

      <div className={styles.profileHours}>
        <ClockIcon />
        <div className={styles.profileHoursList}>
          {hours.length > 0 ? (
            hours.map((entry) => (
              <span key={entry.day} className={styles.profileHoursRow}>
                <strong>{dayLabels[entry.day]}</strong>
                <span>{entry.times}</span>
              </span>
            ))
          ) : (
            <span>{church.operatingHours}</span>
          )}
        </div>
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
