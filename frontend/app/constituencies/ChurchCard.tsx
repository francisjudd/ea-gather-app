'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ConstituencyChurch, ConstituencyService } from '@/lib/constituencies/types'
import styles from './constituency.module.css'

const MAX_PILLS = 3

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h11m-4-4 4 4-4 4" />
    </svg>
  )
}

export const categoriesOf = (church: ConstituencyChurch) => [...new Set(church.programmes.map((p) => p.category))]


// Navy badge with the number of programmes we list for a church. Only shown when there are some.
export function CountBadge({ count }: { count: number }) {
  return (
    <span className={styles.countBadge}>
      <strong>{count}</strong> {count === 1 ? 'programme' : 'programmes'}
    </span>
  )
}

export function ChurchCard({
  church,
  highlighted,
  onOpen,
}: {
  church: ConstituencyChurch
  highlighted: boolean
  onOpen: () => void
}) {
  const categories = categoriesOf(church)
  const extra = categories.length - MAX_PILLS

  return (
    <li className={styles.card} data-highlighted={highlighted} id={`item-${church.id}`}>
      <Link className={`${styles.cardName} ${styles.cardNameLink}`} href={`/churches/${church.id}`}>
        {church.name}
      </Link>
      <button type="button" className={`${styles.cardButton} ${styles.cardButtonBelow}`} aria-haspopup="dialog" onClick={onOpen}>
        {church.denomination && <span className={styles.cardMeta}>{church.denomination}</span>}
        <span className={styles.cardAddress}>
          <PinIcon />
          <span>{church.address ?? 'Address not listed'}</span>
        </span>
        {categories.length > 0 && (
          <span className={styles.pills}>
            {categories.slice(0, MAX_PILLS).map((category) => (
              <span key={category} className={styles.pill}>{category}</span>
            ))}
            {extra > 0 && <span className={styles.pill}>+{extra} more</span>}
          </span>
        )}
        <span className={styles.cardFooter}>
          <span className={styles.cardMore}>
            View details <ArrowIcon />
          </span>
          {church.programmes.length > 0 && <CountBadge count={church.programmes.length} />}
        </span>
      </button>
    </li>
  )
}

// Compact card for the map's side list. Selecting it focuses the map pin; the selected card
// expands to show programme pills and a "View details" button.
export function ChurchCompact({
  church,
  selected,
  onSelect,
  onOpen,
}: {
  church: ConstituencyChurch
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  const categories = categoriesOf(church)

  return (
    <li className={styles.compact} data-selected={selected} id={`item-${church.id}`}>
      <div className={`${styles.compactTop} ${styles.compactHead}`}>
        <Link className={styles.compactName} href={`/churches/${church.id}`}>{church.name}</Link>
        {church.programmes.length > 0 && <CountBadge count={church.programmes.length} />}
      </div>
      <button type="button" className={`${styles.compactButton} ${styles.compactButtonBelow}`} aria-pressed={selected} onClick={onSelect}>
        {church.denomination && <span className={styles.cardMeta}>{church.denomination}</span>}
        <span className={styles.cardAddress}>
          <PinIcon />
          <span>{church.address ?? 'Address not listed'}</span>
        </span>
      </button>
      {selected && (
        <div className={styles.compactMore}>
          {categories.length > 0 && (
            <span className={styles.pills}>
              {categories.slice(0, MAX_PILLS).map((category) => (
                <span key={category} className={styles.pill}>{category}</span>
              ))}
            </span>
          )}
          <button type="button" className={styles.compactDetails} aria-haspopup="dialog" onClick={onOpen}>
            View details <ArrowIcon />
          </button>
        </div>
      )}
    </li>
  )
}

// Services have no details dialog: address and website are shown on the item itself.
export function ServiceCard({
  service,
  highlighted,
  onSelect,
}: {
  service: ConstituencyService
  highlighted: boolean
  onSelect: () => void
}) {
  return (
    <li className={styles.card} data-highlighted={highlighted} id={`item-svc-${service.id}`}>
      <button type="button" className={styles.cardButton} aria-pressed={highlighted} onClick={onSelect}>
        <span className={styles.cardName}>{service.name}</span>
        <span className={styles.pills}>
          <span className={styles.pill}>{service.category}</span>
        </span>
        <span className={styles.cardAddress}>
          <PinIcon />
          <span>{service.address ?? service.postcode ?? 'Address not listed'}</span>
        </span>
        {service.website && (
          <span className={styles.cardFooter}>
            <a className={styles.cardMore} href={service.website} rel="noopener noreferrer" target="_blank" onClick={(event) => event.stopPropagation()}>
              Visit website <ArrowIcon />
            </a>
          </span>
        )}
      </button>
    </li>
  )
}

export function ServiceCompact({
  service,
  selected,
  onSelect,
}: {
  service: ConstituencyService
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li className={styles.compact} data-selected={selected} id={`item-svc-${service.id}`}>
      <button type="button" className={styles.compactButton} aria-pressed={selected} onClick={onSelect}>
        <span className={styles.compactTop}>
          <span className={styles.compactName}>{service.name}</span>
        </span>
        <span className={styles.pills}>
          <span className={styles.pill}>{service.category}</span>
        </span>
        <span className={styles.cardAddress}>
          <PinIcon />
          <span>{service.address ?? service.postcode ?? 'Address not listed'}</span>
        </span>
      </button>
      {selected && service.website && (
        <div className={styles.compactMore}>
          <a className={styles.compactDetails} href={service.website} rel="noopener noreferrer" target="_blank">
            Visit website <ArrowIcon />
          </a>
        </div>
      )}
    </li>
  )
}

export function ChurchDialog({ church, onClose }: { church: ConstituencyChurch | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (church && !dialog.open) dialog.showModal()
    if (!church && dialog.open) dialog.close()
  }, [church])

  const categories = church ? categoriesOf(church) : []

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="church-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (event.target === ref.current) ref.current?.close()
      }}
    >
      {church && (
        <div className={styles.dialogBody}>
          <button type="button" className={styles.dialogClose} onClick={() => ref.current?.close()} aria-label="Close details">
            ×
          </button>
          <h3 id="church-dialog-title" className={styles.dialogTitle}>{church.name}</h3>
          {church.denomination && <p className={styles.cardMeta}>{church.denomination}</p>}
          {church.address && (
            <p className={styles.cardAddress}>
              <PinIcon />
              <span>{church.address}</span>
            </p>
          )}

          <h4 className={styles.dialogHeading}>
            Community programmes
            {church.programmes.length > 0 && <CountBadge count={church.programmes.length} />}
          </h4>
          {church.programmes.length === 0 ? (
            <p className={styles.dialogEmpty}>
              We don&rsquo;t have any programmes listed for this church yet.{' '}
              <Link href="/submit">Tell us what this church does</Link>
            </p>
          ) : (
            <>
              {categories.map((category) => (
                <div key={category} className={styles.programmeGroup}>
                  <span className={styles.pill}>{category}</span>
                  <ul>
                    {church.programmes
                      .filter((programme) => programme.category === category)
                      .map((programme) => (
                        <li key={programme.name}>{programme.name}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </>
          )}

          <Link className={styles.compactDetails} href={`/churches/${church.id}`}>
            View church profile <ArrowIcon />
          </Link>

          {(church.website || church.phone) && (
            <>
              <h4 className={styles.dialogHeading}>Get in touch</h4>
              <ul className={styles.contactList}>
                {church.website && (
                  <li><a href={church.website} rel="noopener noreferrer" target="_blank">Visit website</a></li>
                )}
                {church.phone && <li><a href={`tel:${church.phone.replace(/\s/g, '')}`}>{church.phone}</a></li>}
              </ul>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
