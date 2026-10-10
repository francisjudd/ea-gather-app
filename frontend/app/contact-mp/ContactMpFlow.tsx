'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const flowSteps = [
  { slug: 'intro', label: 'Intro', path: '/contact-mp' },
  { slug: 'mp-lookup', label: 'MP lookup', path: '/contact-mp/mp-lookup' },
  { slug: 'church-details', label: 'Church details', path: '/contact-mp/church-details' },
  { slug: 'activities', label: 'Activities', path: '/contact-mp/activities' },
  { slug: 'message', label: 'Your message', path: '/contact-mp/message' },
  { slug: 'review-send', label: 'Review & send', path: '/contact-mp/review-send' },
  { slug: 'confirmation', label: 'Confirmation', path: '/contact-mp/confirmation' },
] as const

type StepSlug = (typeof flowSteps)[number]['slug']
type SendMethod = 'mailto' | 'download' | ''

type Draft = {
  postcode: string
  mpName: string
  mpParty: string
  mpEmail: string
  churchName: string
  denomination: string
  attendance: string
  churchAddress: string
  senderName: string
  senderRole: string
  senderEmail: string
  selectedActivities: string[]
  activityCounts: Record<string, string>
  personalNote: string
  advocacyFollowUp: boolean
  monthlyUpdate: boolean
  sendMethod: SendMethod
}

type Activity = {
  id: string
  label: string
  frequency?: string
}

const storageKey = 'ea-contact-mp-draft-v1'
const defaultDraft: Draft = {
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

const activities: Activity[] = [
  { id: 'food-bank', label: 'Food bank or food pantry', frequency: 'each week' },
  { id: 'warm-space', label: 'Warm space / community lounge' },
  { id: 'debt-advice', label: 'Debt advice & financial wellbeing', frequency: 'fortnightly' },
  { id: 'clothing-bank', label: 'Clothing or baby bank' },
  { id: 'family-groups', label: 'Parent / toddler & family groups', frequency: 'each week' },
  { id: 'youth', label: 'Youth clubs or mentoring' },
  { id: 'holiday-clubs', label: 'Holiday clubs / school-holiday meals' },
  { id: 'schools', label: 'Schools work or chaplaincy' },
  { id: 'older-people', label: "Older people's lunches & visits" },
  { id: 'mental-health', label: 'Mental health support groups' },
  { id: 'esol', label: 'ESOL classes / refugee support' },
  { id: 'recovery', label: 'Recovery / addiction support' },
  { id: 'prison', label: 'Prison visiting or chaplaincy' },
  { id: 'street-pastors', label: 'Street pastors or homelessness outreach' },
  { id: 'community-groups', label: 'Hosting community groups in our building' },
  { id: 'eco-church', label: 'Environmental / Eco Church work' },
]

const demoMp = {
  name: 'Sarah Whitfield',
  party: 'Labour',
  email: 'sarah.whitfield.mp@parliament.uk',
}

function readDraft(value: string): Draft {
  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved draft is not an object.')
  }

  const saved = parsed as Record<string, unknown>
  const stringValue = (key: keyof Draft) =>
    typeof saved[key] === 'string' ? saved[key] as string : defaultDraft[key] as string

  return {
    ...defaultDraft,
    postcode: stringValue('postcode'),
    mpName: stringValue('mpName'),
    mpParty: stringValue('mpParty'),
    mpEmail: stringValue('mpEmail'),
    churchName: stringValue('churchName'),
    denomination: stringValue('denomination'),
    attendance: stringValue('attendance'),
    churchAddress: stringValue('churchAddress'),
    senderName: stringValue('senderName'),
    senderRole: stringValue('senderRole'),
    senderEmail: stringValue('senderEmail'),
    personalNote: stringValue('personalNote'),
    sendMethod: saved.sendMethod === 'mailto' || saved.sendMethod === 'download' ? saved.sendMethod : '',
    selectedActivities: Array.isArray(saved.selectedActivities)
      ? saved.selectedActivities.filter((item): item is string => typeof item === 'string')
      : [],
    activityCounts: saved.activityCounts && typeof saved.activityCounts === 'object'
      ? Object.fromEntries(
          Object.entries(saved.activityCounts).filter((entry): entry is [string, string] =>
            typeof entry[1] === 'string'),
        )
      : {},
    advocacyFollowUp: saved.advocacyFollowUp === true,
    monthlyUpdate: saved.monthlyUpdate === true,
  }
}

function getEmailBody(draft: Draft) {
  const firstName = draft.mpName.trim().split(/\s+/)[0] || 'there'
  const activitiesText = activities
    .filter((activity) => draft.selectedActivities.includes(activity.id))
    .map((activity) => {
      const count = draft.activityCounts[activity.id]?.trim()
      const amount = count ? ` — around ${count} people${activity.frequency ? `, ${activity.frequency}` : ''}` : ''
      return `- ${activity.label}${amount}`
    })
  const churchName = draft.churchName.trim() || 'our church'
  const constituency = draft.postcode.trim()
    ? 'your constituency'
    : 'our local area'
  const roleAndChurch = [draft.senderRole.trim(), churchName].filter(Boolean).join(' at ')

  return [
    `Dear ${firstName},`,
    '',
    `I'm writing${roleAndChurch ? ` as ${roleAndChurch}` : ''}, a church in ${constituency}.`,
    `I wanted to share a brief picture of what we do week-to-week — in case it's useful as you represent us in Parliament.`,
    '',
    ...(activitiesText.length > 0 ? ['Each week, our team and volunteers run:', ...activitiesText, ''] : []),
    draft.personalNote.trim(),
    ...(draft.advocacyFollowUp
      ? [
          '',
          'The Evangelical Alliance would welcome the chance to meet with you and discuss how churches in your constituency are supporting the community.',
        ]
      : []),
    '',
    'Thank you for the work you do for our area. We pray for you regularly, and we would love to host you at the church should you ever like to visit.',
    '',
    'With every good wish,',
    draft.senderName.trim(),
    [draft.senderRole.trim(), churchName].filter(Boolean).join(', '),
    draft.churchAddress.trim(),
  ].filter((line, index, lines) => line !== '' || (index > 0 && lines[index - 1] !== '')).join('\n')
}

function getSubject(postcode: string) {
  return `From a church in ${postcode.trim() || 'your constituency'} — what we're doing locally`
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string
  name: keyof Draft
  value: string
  onChange: (name: keyof Draft, value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="field" htmlFor={name}>
      <span className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  )
}

export default function ContactMpFlow({ step }: { step: string }) {
  const router = useRouter()
  const currentIndex = flowSteps.findIndex((flowStep) => flowStep.slug === step)
  const currentStep = flowSteps[currentIndex]
  const [draft, setDraft] = useState<Draft>(defaultDraft)
  const [loaded, setLoaded] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [editingMp, setEditingMp] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey)
        if (saved) setDraft(readDraft(saved))
      } catch {
        setStorageError('We could not load your saved draft. You can still continue, but your progress may not be saved.')
      }
      setLoaded(true)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft))
        setStorageError('')
      } catch {
        setStorageError('Your browser could not save this draft. Keep this tab open while you complete the form.')
      }
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [draft, loaded])

  const onChange = (name: keyof Draft, value: string) => {
    setDraft((previous) => ({ ...previous, [name]: value }))
  }
  const emailBody = useMemo(() => getEmailBody(draft), [draft])
  const emailSubject = getSubject(draft.postcode)
  const isDemoPostcode = draft.postcode.replace(/\s/g, '').toUpperCase() === 'DN13LN'

  if (!currentStep) return null

  const navigateTo = (slug: StepSlug) => {
    const target = flowSteps.find((flowStep) => flowStep.slug === slug)
    if (target) router.push(target.path)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextSlug = flowSteps[currentIndex + 1]?.slug
    if (nextSlug) navigateTo(nextSlug)
  }

  const handleFindMp = () => {
    setDraft((previous) => ({
      ...previous,
      mpName: isDemoPostcode ? demoMp.name : previous.mpName,
      mpParty: isDemoPostcode ? demoMp.party : previous.mpParty,
      mpEmail: isDemoPostcode ? demoMp.email : previous.mpEmail,
    }))
    navigateTo('mp-lookup')
  }

  const handleSend = () => {
    const recipient = encodeURIComponent(draft.mpEmail)
    const cc = draft.senderEmail ? `&cc=${encodeURIComponent(draft.senderEmail)}` : ''
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject)}${cc}&body=${encodeURIComponent(emailBody)}`
    window.open(mailto, '_self')
    setDraft((previous) => ({ ...previous, sendMethod: 'mailto' }))
    navigateTo('confirmation')
  }

  const handleDownload = () => {
    const headers = [
      `To: ${draft.mpName} MP <${draft.mpEmail}>`,
      ...(draft.senderEmail ? [`Cc: ${draft.senderName} <${draft.senderEmail}>`] : []),
      `Subject: ${emailSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    ]
    const file = new Blob([`${headers.join('\r\n')}\r\n\r\n${emailBody.replace(/\n/g, '\r\n')}\r\n`], {
      type: 'message/rfc822;charset=utf-8',
    })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'church-letter-to-mp.eml'
    link.click()
    URL.revokeObjectURL(url)
    setDraft((previous) => ({ ...previous, sendMethod: 'download' }))
    navigateTo('confirmation')
  }

  const resetDraft = () => {
    setDraft(defaultDraft)
    try {
      window.localStorage.removeItem(storageKey)
      setStorageError('')
    } catch {
      setStorageError('We could not clear the saved draft from this browser.')
    }
    navigateTo('intro')
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand-lockup" href="/contact-mp" aria-label="More Than Sunday — start again">
          <span className="brand-name">More Than <strong>Sunday</strong></span>
        </Link>
        <span className="header-caption">An initiative from the Evangelical Alliance</span>
      </header>

      <div className="flow-layout">
        <aside className="flow-sidebar" aria-label="Form progress">
          <p className="sidebar-kicker">YOUR LETTER</p>
          <h1>Tell your MP what your church is doing locally.</h1>
          <p className="sidebar-copy">A personal note can help your MP understand the difference churches make in your community.</p>
          <ol className="progress-list">
            {flowSteps.map((flowStep, index) => {
              const isCurrent = index === currentIndex
              const isComplete = index < currentIndex
              return (
                <li key={flowStep.slug} className={`${isCurrent ? 'is-current' : ''} ${isComplete ? 'is-complete' : ''}`}>
                  <span className="progress-number" aria-hidden="true">{isComplete ? '✓' : index + 1}</span>
                  <span>{flowStep.label}</span>
                </li>
              )
            })}
          </ol>
          <div className="sidebar-note">
            <span className="note-icon" aria-hidden="true">✳</span>
            <p><strong>Small things count.</strong><br />Tell the story of what happens week to week — it all matters.</p>
          </div>
        </aside>

        <section className="form-panel" aria-labelledby="step-title">
          <div className="step-meta">
            <span>STEP {currentIndex + 1} OF 7</span>
            <span className="step-meta-divider" aria-hidden="true">·</span>
            <span>{currentStep.label.toUpperCase()}</span>
          </div>

          {storageError && <p className="storage-alert" role="status">{storageError}</p>}

          {step === 'intro' && (
            <>
              <h2 className="ea-underline" id="step-title">Let’s start with your church postcode.</h2>
              <p className="step-description">We’ll use this to find your constituency and the MP who represents your church’s area.</p>
              <form className="step-form" onSubmit={(event) => { event.preventDefault(); handleFindMp() }}>
                <Field
                  label="Church postcode"
                  name="postcode"
                  value={draft.postcode}
                  onChange={onChange}
                  placeholder="e.g. DN1 3LN"
                  autoComplete="postal-code"
                  required
                />
                <div className="privacy-note"><span aria-hidden="true">⌖</span> Your postcode is only used to identify your MP.</div>
                <button className="button button-primary" type="submit">Find my MP <span aria-hidden="true">→</span></button>
              </form>
              <div className="benefit-row">
                <span><b aria-hidden="true">◷</b> Takes about 5 minutes</span>
                <span><b aria-hidden="true">↗</b> We’ll save your draft</span>
                <span><b aria-hidden="true">✉</b> Sent from your inbox</span>
              </div>
            </>
          )}

          {step === 'mp-lookup' && (
            <>
              <h2 className="ea-underline" id="step-title">Is this your MP?</h2>
              <p className="step-description">Check the details before we build your letter.</p>
              {isDemoPostcode && !editingMp ? (
                <>
                  <article className="mp-card">
                    <div className="mp-avatar" aria-hidden="true">{draft.mpName.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'MP'}</div>
                    <div>
                      <p className="result-label">YOUR CONSTITUENCY</p>
                      <h3>Doncaster Central</h3>
                      <p className="mp-name">{draft.mpName} <span>· {draft.mpParty}</span></p>
                      <a className="text-link" href={`mailto:${draft.mpEmail}`}>{draft.mpEmail}</a>
                    </div>
                  </article>
                  <p className="demo-disclaimer">Demo result from the mock-up for DN1 3LN. A live Parliament postcode lookup is not connected yet — please check these details before sending.</p>
                </>
              ) : (
                <div className="lookup-empty">
                  <span className="empty-icon" aria-hidden="true">⌖</span>
                  <h3>Check your MP’s details</h3>
                  <p>A live postcode lookup is not connected yet. Enter the correct MP details below to continue.</p>
                </div>
              )}
              {(editingMp || !isDemoPostcode) && (
                <div className="mp-edit-grid">
                  <Field label="MP name" name="mpName" value={draft.mpName} onChange={onChange} required />
                  <Field label="Party" name="mpParty" value={draft.mpParty} onChange={onChange} />
                  <Field label="MP email" name="mpEmail" value={draft.mpEmail} onChange={onChange} type="email" required />
                </div>
              )}
              <div className="action-row action-row-split">
                <button className="button button-quiet" type="button" onClick={() => navigateTo('intro')}>← Back</button>
                <div className="action-row">
                  {isDemoPostcode && <button className="button button-text" type="button" onClick={() => setEditingMp((value) => !value)}>{editingMp ? 'Use demo details' : 'This isn’t right — let me edit'}</button>}
                  <button className="button button-primary" type="button" disabled={!draft.mpName.trim() || !draft.mpEmail.trim()} onClick={() => navigateTo('church-details')}>Yes, that’s my MP <span aria-hidden="true">→</span></button>
                </div>
              </div>
            </>
          )}

          {step === 'church-details' && (
            <>
              <h2 className="ea-underline" id="step-title">Tell us about your church.</h2>
              <p className="step-description">A few details will help your MP understand who you are and where you serve.</p>
              <form className="step-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <Field label="Church name" name="churchName" value={draft.churchName} onChange={onChange} placeholder="e.g. St Mark’s Church" required />
                  <Field label="Denomination or network" name="denomination" value={draft.denomination} onChange={onChange} placeholder="e.g. Church of England" />
                  <Field label="Approx. weekly attendance" name="attendance" value={draft.attendance} onChange={onChange} type="number" placeholder="e.g. 180" />
                  <Field label="Church address" name="churchAddress" value={draft.churchAddress} onChange={onChange} placeholder="Street, town and postcode" autoComplete="street-address" required />
                </div>
                <div className="section-rule"><span>ABOUT YOU</span></div>
                <div className="form-grid">
                  <Field label="Your name" name="senderName" value={draft.senderName} onChange={onChange} autoComplete="name" required />
                  <Field label="Your role" name="senderRole" value={draft.senderRole} onChange={onChange} placeholder="e.g. Vicar, volunteer, church member" />
                  <Field label="Your email" name="senderEmail" value={draft.senderEmail} onChange={onChange} type="email" autoComplete="email" required />
                </div>
                <div className="action-row action-row-split">
                  <button className="button button-quiet" type="button" onClick={() => navigateTo('mp-lookup')}>← Back</button>
                  <button className="button button-primary" type="submit">Next <span aria-hidden="true">→</span></button>
                </div>
              </form>
            </>
          )}

          {step === 'activities' && (
            <>
              <h2 className="ea-underline" id="step-title">What does your church do for the community?</h2>
              <p className="step-description">Tick the things you do regularly, even the small things. Rough numbers are absolutely fine.</p>
              <form className="step-form" onSubmit={handleSubmit}>
                <div className="activity-list">
                  {activities.map((activity) => {
                    const checked = draft.selectedActivities.includes(activity.id)
                    return (
                      <div className={`activity-item ${checked ? 'activity-selected' : ''}`} key={activity.id}>
                        <label className="activity-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => setDraft((previous) => ({
                              ...previous,
                              selectedActivities: event.target.checked
                                ? [...previous.selectedActivities, activity.id]
                                : previous.selectedActivities.filter((id) => id !== activity.id),
                            }))}
                          />
                          <span>{activity.label}</span>
                        </label>
                        {checked && (
                          <label className="activity-count">
                            <span className="visually-hidden">Approximate number for {activity.label}</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="Number"
                              value={draft.activityCounts[activity.id] || ''}
                              onChange={(event) => setDraft((previous) => ({
                                ...previous,
                                activityCounts: { ...previous.activityCounts, [activity.id]: event.target.value },
                              }))}
                            />
                            <span>people</span>
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="selection-summary"><span aria-hidden="true">✓</span> Selected {draft.selectedActivities.length} {draft.selectedActivities.length === 1 ? 'activity' : 'activities'}</p>
                <div className="action-row action-row-split">
                  <button className="button button-quiet" type="button" onClick={() => navigateTo('church-details')}>← Back</button>
                  <button className="button button-primary" type="submit">Next <span aria-hidden="true">→</span></button>
                </div>
              </form>
            </>
          )}

          {step === 'message' && (
            <>
              <h2 className="ea-underline" id="step-title">In your own words.</h2>
              <p className="step-description">A single personal sentence makes this read like a letter, not a form. What would you like your MP to know?</p>
              <form className="step-form" onSubmit={handleSubmit}>
                <label className="field" htmlFor="personalNote">
                  <span className="field-label">Your personal note</span>
                  <textarea
                    id="personalNote"
                    name="personalNote"
                    rows={5}
                    maxLength={1000}
                    value={draft.personalNote}
                    onChange={(event) => onChange('personalNote', event.target.value)}
                    placeholder="We’re seeing more working families come to our food bank than ever before. We’d love your help keeping the school holiday clubs running in our area."
                    required
                  />
                </label>
                <div className="message-hint"><span>Suggested length: 100–400 characters</span><span>{draft.personalNote.length} characters</span></div>
                <div className="prompt-chips" aria-label="Writing prompts">
                  {['We’re seeing demand grow for…', 'A story that stuck with us…', 'We partner with the council on…', 'We’d love to invite you to visit…'].map((prompt) => (
                    <button className="prompt-chip" type="button" key={prompt} onClick={() => onChange('personalNote', `${draft.personalNote}${draft.personalNote ? ' ' : ''}${prompt}`)}>{prompt}</button>
                  ))}
                </div>
                <div className="extras-card">
                  <label className="toggle-row">
                    <input type="checkbox" checked={draft.advocacyFollowUp} onChange={(event) => setDraft((previous) => ({ ...previous, advocacyFollowUp: event.target.checked }))} />
                    <span><strong>I’d be happy for the Evangelical Alliance advocacy team to follow up</strong><small>A member of the team may get in touch about your church’s work.</small></span>
                  </label>
                  <label className="toggle-row">
                    <input type="checkbox" checked={draft.monthlyUpdate} onChange={(event) => setDraft((previous) => ({ ...previous, monthlyUpdate: event.target.checked }))} />
                    <span><strong>Send me the Evangelical Alliance’s monthly advocacy update</strong><small>You can unsubscribe at any time.</small></span>
                  </label>
                </div>
                <p className="demo-disclaimer">These preferences are saved in this browser only. They won’t be sent to the Evangelical Alliance until a form-submission service is connected.</p>
                <div className="action-row action-row-split">
                  <button className="button button-quiet" type="button" onClick={() => navigateTo('activities')}>← Back</button>
                  <button className="button button-primary" type="submit">Review email <span aria-hidden="true">→</span></button>
                </div>
              </form>
            </>
          )}

          {step === 'review-send' && (
            <>
              <h2 className="ea-underline" id="step-title">Read it like your MP will.</h2>
              <p className="step-description">Here’s the email your MP will receive. You can go back to make changes before opening it in your email app.</p>
              <article className="email-preview">
                <div className="email-meta"><span>FROM</span><p>{draft.senderName || 'Your name'} &lt;{draft.senderEmail || 'your email'}&gt;</p></div>
                <div className="email-meta"><span>TO</span><p>{draft.mpName || 'Your MP'} MP &lt;{draft.mpEmail || 'MP email'}&gt;</p></div>
                <div className="email-meta"><span>SUBJECT</span><p>{emailSubject}</p></div>
                <div className="email-body">{emailBody}</div>
              </article>
              <p className="review-legend"><span aria-hidden="true">■</span> Your details and personal message are included in the letter.</p>
              <div className="action-row action-row-split review-actions">
                <button className="button button-quiet" type="button" onClick={() => navigateTo('message')}>← Back</button>
                <div className="action-row">
                  <button className="button button-secondary" type="button" onClick={handleDownload}>Download .eml</button>
                  <button className="button button-primary" type="button" disabled={!draft.mpEmail || !draft.senderEmail} onClick={handleSend}>Open in my email client <span aria-hidden="true">↗</span></button>
                </div>
              </div>
              <p className="send-note">Your email app will open with the letter ready to send. Nothing is sent until you press send there.</p>
            </>
          )}

          {step === 'confirmation' && (
            <div className="confirmation-content">
              <div className="confirmation-icon" aria-hidden="true">✓</div>
              <p className="confirmation-kicker">DRAFT READY</p>
              <h2 className="ea-underline" id="step-title">{draft.sendMethod === 'download' ? 'Your email draft has downloaded.' : 'Your draft is ready in your email client.'}</h2>
              <p className="step-description">
                {draft.sendMethod === 'download'
                  ? 'Open the downloaded .eml file in your email app, then review and send it.'
                  : `The email is addressed to ${draft.mpName || 'your MP'}${draft.senderEmail ? `, with a copy to ${draft.senderEmail}` : ''}. Review it and press send in your email app.`}
              </p>
              <div className="next-steps">
                <h3>What happens next</h3>
                <div><span>01</span><p><strong>Your email reaches the constituency office.</strong><br />Replies usually take 2–6 weeks and come straight to your inbox.</p></div>
                {draft.advocacyFollowUp && <div><span>02</span><p><strong>You asked for advocacy team follow-up.</strong><br />This preference is saved in this browser only and hasn’t been sent yet.</p></div>}
                {draft.monthlyUpdate && <div><span>03</span><p><strong>You asked for the monthly advocacy update.</strong><br />This preference is saved in this browser only and hasn’t been sent yet.</p></div>}
              </div>
              <div className="action-row confirmation-actions">
                <button className="button button-primary" type="button" onClick={resetDraft}>Send another from a different church <span aria-hidden="true">→</span></button>
                <a className="button button-quiet" href="https://www.eauk.org/" target="_blank" rel="noreferrer">Learn about Evangelical Alliance membership ↗</a>
              </div>
            </div>
          )}

          {currentIndex > 0 && currentIndex < 6 && (
            <p className="autosave-note"><span aria-hidden="true">✓</span> Your progress is saved in this browser</p>
          )}
        </section>
      </div>
      <footer className="site-footer">
        <span>MORE THAN SUNDAY · CHURCH ACTION</span>
        <span>Questions? <a href="mailto:advocacy@eauk.org">Contact the advocacy team</a></span>
        <div className="site-footer-legal">
          The Evangelical Alliance. A company limited by guarantee registered in England and Wales No. 123448.
          Registered Charity No England and Wales: 212325, Scotland: SC040576. Registered office: 176 Copenhagen Street, London, N1 0ST.
        </div>
      </footer>
    </main>
  )
}
