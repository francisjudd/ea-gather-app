import styles from './churches.module.css'

export function ChurchMark() {
  return (
    <span className={styles.brandLockup}>
      <span className={styles.brandName}>evangelical <strong>alliance</strong></span>
      <span className={styles.brandDots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  )
}

export function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}
