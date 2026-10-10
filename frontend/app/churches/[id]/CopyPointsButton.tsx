'use client'

import { useState } from 'react'

type Point = { figure: string; label: string; text: string }

export default function CopyPointsButton({
  churchName,
  constituency,
  points,
}: {
  churchName: string
  constituency: string
  points: Point[]
}) {
  const [copied, setCopied] = useState(false)

  async function copyPoints() {
    const lines = points.map((point) => `• ${point.label}: ${point.figure} ${point.text}`)
    const body = `${churchName} (${constituency})\n${lines.join('\n')}\nSource: More Than Sunday, Evangelical Alliance`
    try {
      await navigator.clipboard.writeText(body)
    } catch {
      /* Clipboard not available (e.g. insecure context); leave silently. */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button type="button" onClick={copyPoints} className="button button-secondary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
      {copied ? 'Copied' : 'Copy talking points'}
    </button>
  )
}
