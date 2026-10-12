'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useInfiniteList<T>(
  items: T[],
  { batchSize, resetKey }: { batchSize: number; resetKey: string },
) {
  const [page, setPage] = useState({ resetKey, count: batchSize })
  const sentinelRef = useRef<HTMLDivElement>(null)
  const visibleCount = Math.min(page.resetKey === resetKey ? page.count : batchSize, items.length)
  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    setPage((current) => {
      const count = current.resetKey === resetKey ? current.count : batchSize
      return {
        resetKey,
        count: Math.min(count + batchSize, items.length),
      }
    })
  }, [batchSize, items.length, resetKey])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '0px 0px 400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return { visibleItems, visibleCount, hasMore, loadMore, sentinelRef }
}
