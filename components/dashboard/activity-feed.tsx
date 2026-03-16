'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FeedSkeleton } from './loading-skeleton'

export type EventType = 'purchase' | 'redemption' | 'signup' | 'alert'

export interface FeedEvent {
  id: string
  type: EventType
  user: string
  action: string
  timestamp: Date | string
  metadata?: Record<string, unknown>
}

export interface ActivityFeedProps {
  events: FeedEvent[]
  maxHeight?: number
  pageSize?: number
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

const typeColors: Record<EventType, string> = {
  purchase: '#16a34a',
  redemption: '#2563eb',
  signup: '#7c3aed',
  alert: '#dc2626',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function relativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function EventItem({ event, isNew }: { event: FeedEvent; isNew: boolean }) {
  const [entered, setEntered] = useState(!isNew)
  const color = typeColors[event.type]

  useEffect(() => {
    if (isNew) {
      const frame = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(frame)
    }
  }, [isNew])

  return (
    <div
      className="flex items-start gap-3 py-3 px-1"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {getInitials(event.user)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text, #111)' }}>
          <span className="font-semibold">{event.user}</span>{' '}
          <span style={{ color: 'var(--text-muted, #6b7280)' }}>{event.action}</span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
          {relativeTime(event.timestamp)}
        </p>
      </div>

      {/* Type dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0 mt-2"
        style={{ backgroundColor: color }}
        title={event.type}
      />
    </div>
  )
}

export function ActivityFeed({
  events,
  maxHeight = 400,
  loading = false,
  onLoadMore,
  hasMore = false,
}: ActivityFeedProps) {
  const prevCountRef = useRef(events.length)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (events.length > prevCountRef.current) {
      const added = new Set(events.slice(0, events.length - prevCountRef.current).map((e) => e.id))
      setNewIds(added)
      const timer = setTimeout(() => setNewIds(new Set()), 500)
      prevCountRef.current = events.length
      return () => clearTimeout(timer)
    }
    prevCountRef.current = events.length
  }, [events])

  if (loading) return <FeedSkeleton />

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--text-muted, #6b7280)' }}>
          No activity yet
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        className="overflow-y-auto divide-y"
        style={{
          maxHeight,
          borderColor: 'var(--border, #e5e7eb)',
        }}
      >
        {events.map((event) => (
          <EventItem key={event.id} event={event} isNew={newIds.has(event.id)} />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="pt-3 text-center">
          <button
            onClick={onLoadMore}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary, #6366f1)' }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
