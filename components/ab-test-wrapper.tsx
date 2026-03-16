'use client'

import { useState, useEffect, type ReactNode } from 'react'

type ABTestWrapperProps = {
  testName: string
  variants: Record<string, ReactNode>
  fallback?: ReactNode
}

export function ABTestWrapper({ testName, variants, fallback }: ABTestWrapperProps) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchVariant() {
      try {
        const res = await fetch(`/api/ab-tests/variant?test=${encodeURIComponent(testName)}`)
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()
        if (!cancelled && data.variant) {
          setVariantId(data.variant.variantId)
        }
      } catch {
        // Silently fail — render fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVariant()
    return () => { cancelled = true }
  }, [testName])

  if (loading) return fallback ?? null
  if (!variantId || !(variantId in variants)) {
    // Default to first variant key if available
    const firstKey = Object.keys(variants)[0]
    return firstKey ? <>{variants[firstKey]}</> : (fallback ?? null)
  }

  return <>{variants[variantId]}</>
}
