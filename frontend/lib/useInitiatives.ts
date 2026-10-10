'use client'

import { useEffect, useState } from 'react'
import { initiativeTypes, loadInitiatives, type Initiative } from './initiatives'

/**
 * Load the initiative taxonomy from the API (/openapi/initiatives), falling back
 * to the static list while the request is in flight or if it fails.
 */
export function useInitiatives(): Initiative[] {
  const [initiatives, setInitiatives] = useState<Initiative[]>(initiativeTypes)

  useEffect(() => {
    let cancelled = false
    void loadInitiatives().then((data) => {
      if (!cancelled) setInitiatives(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return initiatives
}
