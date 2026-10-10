'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import FullNav from '../../components/FullNavigation'
import { submitChurch } from '../../lib/churchStore'
import { initiativeTypes } from '../../lib/initiatives'

type FormState = {
  name: string
  denomination: string
  address: string
  place: string
  postcode: string
  operatingHours: string
  contactName: string
  phoneNumber: string
  contactEmail: string
  initiatives: string[]
}

const initialForm: FormState = {
  name: '',
  denomination: '',
  address: '',
  place: '',
  postcode: '',
  operatingHours: '',
  phoneNumber: '',
  contactName: '',
  contactEmail: '',
  initiatives: [],
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
  name: keyof FormState
  value: string
  onChange: (name: keyof FormState, value: string) => void
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

export default function SubmitChurchForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onChange = (name: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const toggleInitiative = (id: string) => {
    setForm((previous) => ({
      ...previous,
      initiatives: previous.initiatives.includes(id)
        ? previous.initiatives.filter((item) => item !== id)
        : [...previous.initiatives, id],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await submitChurch(form)
      setSubmitted(true)
    } catch {
      setError('We could not save your submission. Please try again, or email advocacy@eauk.org for help.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm(initialForm)
    setSubmitted(false)
  }

  return (
    <main className="app-shell">
      <FullNav />

      <div className="flow-layout">
        <aside className="flow-sidebar">
          <p className="sidebar-kicker">ADD TO THE DIRECTORY</p>
          <h1>Tell us about a church.</h1>
          <p className="sidebar-copy">
            Know a church running community initiatives? Share what it does so it can be added to the
            Evangelical Alliance directory.
          </p>
          <div className="sidebar-note">
            <span className="note-icon" aria-hidden="true">✳</span>
            <p><strong>Small things count.</strong><br />Even a weekly food bank or a warm space is worth sharing.</p>
          </div>
        </aside>

        <section className="form-panel" aria-labelledby="submit-title">
          {submitted ? (
            <div className="confirmation-content">
              <div className="confirmation-icon" aria-hidden="true">✓</div>
              <p className="confirmation-kicker">THANK YOU</p>
              <h2 className="ea-underline" id="submit-title">Your submission has been received.</h2>
              <p className="step-description">
                It has been saved for review and will appear in the directory once it has been checked.
              </p>
              <div className="action-row confirmation-actions">
                <button className="button button-primary" type="button" onClick={resetForm}>
                  Submit another church <span aria-hidden="true">→</span>
                </button>
                <Link className="button button-quiet" href="/churches">Back to the directory</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="step-meta">
                <span>SUBMIT A CHURCH</span>
                <span className="step-meta-divider" aria-hidden="true">·</span>
                <span>NEW ENTRY</span>
              </div>
              <h2 className="ea-underline" id="submit-title">Add a church to the directory.</h2>
              <p className="step-description">
                Fill in what you know. Fields marked with an asterisk are required.
              </p>

              <form className="step-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <Field label="Church name" name="name" value={form.name} onChange={onChange} placeholder="e.g. St Mark's Church" required />
                  <Field label="Denomination or network" name="denomination" value={form.denomination} onChange={onChange} placeholder="e.g. Church of England" />
                  <Field label="Church address" name="address" value={form.address} onChange={onChange} placeholder="Street, town and postcode" autoComplete="street-address" required />
                  <Field label="Town or place" name="place" value={form.place} onChange={onChange} placeholder="e.g. Doncaster" />
                  <Field label="Postcode" name="postcode" value={form.postcode} onChange={onChange} placeholder="e.g. DN1 3LN" autoComplete="postal-code" />
                  <Field label="Operating hours" name="operatingHours" value={form.operatingHours} onChange={onChange} placeholder="e.g. Sun 10:30am" />
                  <Field label="Phone number" name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="012 3456 7890" />
                </div>

                <div className="section-rule"><span>CONTACT</span></div>
                <div className="form-grid">
                  <Field label="Your name" name="contactName" value={form.contactName} onChange={onChange} autoComplete="name" required />
                  <Field label="Your email" name="contactEmail" value={form.contactEmail} onChange={onChange} type="email" autoComplete="email" required />
                </div>

                <div className="section-rule"><span>COMMUNITY INITIATIVES</span></div>
                <div className="activity-list">
                  {initiativeTypes.map((initiative) => {
                    const checked = form.initiatives.includes(initiative.id)
                    return (
                      <div className={`activity-item ${checked ? 'activity-selected' : ''}`} key={initiative.id}>
                        <label className="activity-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleInitiative(initiative.id)}
                          />
                          <span>{initiative.label}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
                <p className="selection-summary">
                  <span aria-hidden="true">✓</span> Selected {form.initiatives.length} {form.initiatives.length === 1 ? 'initiative' : 'initiatives'}
                </p>

                {error && <p className="form-error" role="alert">{error}</p>}

                <div className="action-row action-row-split">
                  <Link className="button button-quiet" href="/churches">← Back to directory</Link>
                  <button className="button button-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit for review'} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </>
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
