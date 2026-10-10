import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FullNav from '../../../components/FullNavigation'
import TalkingPoints from '../../../components/TalkingPoints'

import {
  getChurchById,
  getChurchIds,
  categoryLabels,
  type CategoryId,
  type ChurchActivity,
  type ChurchProfile,
} from '../church-data'
import { dayLabels, dayShortLabels, type DayKey } from '../../../lib/churchHours'
import { constituencies } from '@/lib/constituencies/source'
import { slugifyConstituency } from '@/lib/constituencies/slug'
import CopyPointsButton from './CopyPointsButton'
import styles from './church-profile.module.css'
import c from '../../constituencies/constituency.module.css'

// Mockup shows the week Mon→Sun; the profile data stores days in the same order.
const WEEK: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** Turn a bare numeric figure into a locale string (e.g. 3400 → "3,400"). */
function formatFigure(value: number): string {
  return value.toLocaleString('en-GB')
}

/** Initials for the MP avatar, e.g. "Sarah Whitfield" → "SW". */
function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('en-GB')
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('en-GB')
}

/** Small inline icon per activity category. Colour comes from the chip token. */
function CategoryIcon({ category }: { category: CategoryId }) {
  switch (category) {
    case 'practical':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
          <path d="M4 10h16l-1.5 9h-13L4 10Zm4 0 4-6 4 6" />
        </svg>
      )
    case 'youth':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-3-4.6" />
        </svg>
      )
    case 'wellbeing':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-3Z" />
        </svg>
      )
    case 'vulnerable':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-3Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'environment':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 4 13c0-3 2-6 7-8 .6-2 2.4-3 3.8-3 .7 0 1.2.5 1.2 1.2 0 1.7-1.7 3.3-1.5 4.8 2 2 4.5 3 4.5 6a7 7 0 0 1-8 6Z" />
        </svg>
      )
    default:
      return null
  }
}

/** Weekly strip: Mon→Sun with the activity's days marked on. */
function WeekStrip({ days }: { days: DayKey[] }) {
  const active = new Set(days)
  return (
    <ol className={styles.week} aria-label={`Runs: ${days.map((day) => dayLabels[day]).join(', ')}`}>
      {WEEK.map((day) => (
        <li key={day} data-on={active.has(day) ? 'true' : 'inactive'}>
          {dayShortLabels[day].slice(0, 1)}
        </li>
      ))}
    </ol>
  )
}

type Props = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await getChurchIds()
  return ids.map((id) => ({ id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const church = await getChurchById(id)
  if (!church) return {}
  return {
    title: `${church.name} · Church impact profile | Evangelical Alliance`,
    description: `How ${church.name} serves ${church.constituency} beyond Sunday: weekly reach, community projects and partnership opportunities.`,
  }
}

function ActivitiesPanel({ activities }: { activities: ChurchActivity[] }) {
  return (
    <section className={styles.panel} aria-labelledby="projects-h">
      <p className={styles.kicker}>Beyond Sunday</p>
      <h2 id="projects-h" className={styles.underline}>
        Community projects
      </h2>
      {activities.length === 0 ? (
        <p className={styles.lede}>This church has not listed any weekday community projects yet.</p>
      ) : (
        <ul className={styles.activities}>
          {activities.map((activity) => (
            <li key={activity.id} className={styles.activity}>
              <h3>{activity.title}</h3>
              <div className={styles.activityMeta}>
                <span className={styles.chip} data-cat={activity.category}>
                  <CategoryIcon category={activity.category} />
                  {categoryLabels[activity.category]}
                </span>
                <WeekStrip days={activity.days} />
              </div>
              <div className={styles.activityReach}>
                <b>{activity.reach}</b>
                <span>{activity.reachUnit}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function ChurchProfilePage({ params }: Props) {
  const { id } = await params
  const church = await getChurchById(id)
  if (!church) notFound()


  interface Item {
    label: string;
    figure: string;
    text: string;
  }

const items: Item[] = church.talkingPoints;

const points: string[] = items.map(({ label, figure, text }) => `${figure} ${label}. ${text}`);

  // Link to the constituency page only when one exists (a church with no constituency falls back
  // to its place name, which has no page).
  const constituencySlugs = new Set((await constituencies.list()).map((item) => item.slug))
  const constituencySlug = slugifyConstituency(church.constituency)
  const constituencyHref = constituencySlugs.has(constituencySlug) ? `/constituencies/${constituencySlug}` : null

  const attendanceText =
    church.attendance != null ? `${church.attendance.toLocaleString('en-GB')} on Sundays` : 'Sunday meeting'

  return (
    <div className={styles.shell}>
      <FullNav />

      <main>
        {/* Hero band */}
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <nav className={c.breadcrumb} aria-label="Breadcrumb">
              <ol>
                <li><Link href="/">Home</Link></li>
                {constituencyHref ? (
                  <>
                    <li><Link href="/constituencies">Constituencies</Link></li>
                    <li><Link href={constituencyHref}>{church.constituency}</Link></li>
                  </>
                ) : (
                  <li><Link href="/churches">Churches</Link></li>
                )}
                <li aria-current="page">{church.name}</li>
              </ol>
            </nav>
            <p className={styles.kicker}>Church impact profile</p>
            <h1 className={styles.title}>{church.name}</h1>
            <div className={styles.meta}>
              <span>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {constituencyHref ? <Link href={constituencyHref}>{church.constituency}</Link> : church.constituency}
              </span>
              <span>{church.denomination}</span>
              <span>{attendanceText}</span>
              {church.verified && (
                <span className={styles.verified}>
                  <svg viewBox="0 0 20 20" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 10 3 3 7-7" />
                  </svg>
                  Verified{church.verifiedDate ? ` · ${church.verifiedDate}` : ''}
                </span>
              )}
            </div>
          </div>
        </section>


        {/* Headline stats strip (overlaps the hero) */}
        <div className={styles.wrap}>
          <section className={styles.stats} aria-label="Headline impact">
            <div className={styles.stat}>
              <div className={styles.statValue}>{church.reachPerWeek}</div>
              <div className={styles.statLabel}>People reached each week</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{church.projectCount}</div>
              <div className={styles.statLabel}>Community projects</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{formatFigure(church.volunteerHoursYear)}</div>
              <div className={styles.statLabel}>Volunteer hours a year</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{church.daysOpenLabel}</div>
              <div className={styles.statLabel}>Days the building is open</div>
            </div>
          </section>
        </div>

        {/* Body */}
        <div className={`${styles.wrap} ${styles.layout}`}>
          <div>
            {/* Talking points */}
            {/*<section className={styles.panel} aria-labelledby="points-h">
              <p className={styles.kicker}>For Parliament</p>
              <h2 id="points-h" className={styles.underline}>
                What this church means for {church.constituency}
              </h2>
              <br />
              <p className={styles.lede}>Local evidence, ready to cite in debates, APPGs and constituency updates.</p>
              {points.length === 0 ? (
                <p className={styles.lede}>More talking points are being added for this church.</p>
              ) : (
                <ul className={styles.points}>
                  {points.map((point) => (
                    <li key={point.label} className={styles.point}>
                      <span className={styles.pointFigure}>{point.figure}</span>
                      <p>
                        <span className={styles.pointLabel}>{point.label}</span>
                        {point.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.panelFoot}>
                <p className={styles.note}>Self-reported by the church · More Than Sunday, Evangelical Alliance</p>
                {points.length > 0 && (
                  <CopyPointsButton churchName={church.name} constituency={church.constituency} points={points} />
                )}
              </div>
            </section>*/}
            <TalkingPoints
              talkingPoints={points}
              mpHref="/contact-mp"
              email={church.mp.email}
              name={church.mp.name}
              subject= { "Talking points from " + church.name}
            />

            {/* Community projects */}
            <ActivitiesPanel activities={church.activities} />

            {/* Story */}
            <section className={`${styles.panel} ${styles.story}`} aria-labelledby="story-h">
              <p className={styles.kicker}>A word from the church</p>
              <blockquote className={styles.blockquote}>{church.story.quote}</blockquote>
              <cite className={styles.cite}>
                <b>{church.story.author}</b> · {church.story.role}
              </cite>
            </section>
          </div>


          {/* Sidebar */}
          <aside className={styles.aside}>
            <section className={styles.card} aria-labelledby="mp-h">
              <Link href="/contact-mp" style={{textDecoration: "none"}}>
                <p className={styles.kicker}>Your MP</p>
                <hr className={styles.dotted} />
                <div className={styles.mp}>
                  <div className={styles.mpAvatar} aria-hidden="true">
                    {initials(church.mp.name)}
                  </div>
                  <div>
                    <b>{church.mp.name}</b>
                    <span>
                      {church.mp.party ? `${church.mp.party} · ` : ''}
                      {church.mp.constituency}
                    </span>
                  </div>
                </div>
              </Link>
            </section>

            <section className={styles.card} aria-labelledby="contact-h">
              <p className={styles.kicker}>Church contact</p>
              <hr className={styles.dotted} />
              <dl className={styles.contactdl}>
                <div>
                  <dt>Named contact</dt>
                  <dd>{church.contact.name}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{church.contact.address}</dd>
                </div>
                {church.contact.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${church.contact.email}`}>{church.contact.email}</a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.kicker}>More Than Sunday · Church action</span>
        <span>
          Questions? <a href="mailto:advocacy@eauk.org">Contact the advocacy team</a> · <Link href="/sitemap">Sitemap</Link>
        </span>
        <div className={styles.footerLegal}>
          The Evangelical Alliance. A company limited by guarantee registered in England and Wales No. 123448.
          Registered Charity No England and Wales: 212325, Scotland: SC040576. Registered office: 176 Copenhagen
          Street, London, N1 0ST.
        </div>
      </footer>
    </div>
  )
}

