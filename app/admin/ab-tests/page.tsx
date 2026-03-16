'use client'

import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, Play, Pause, CheckCircle, Trash2, Plus, BarChart3 } from 'lucide-react'
import { WarmCard } from '@/components/warm-card'
import { WarmButton } from '@/components/warm-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Variant = {
  id: string
  name: string
  weight: number
  config: Record<string, unknown>
  impressions?: number
  conversions?: number
  conversionRate?: number
}

type ABTest = {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'running' | 'paused' | 'completed'
  targetType: string
  targetId: string | null
  variants: Variant[]
  metrics: { impressions: Record<string, number>; conversions: Record<string, number> } | null
  winnerId: string | null
  assignmentCount: number
  startedAt: string | null
  endedAt: string | null
  createdAt: string
}

type TestResults = {
  testId: string
  testName: string
  status: string
  variants: Variant[]
  significance: number | null
  winnerId: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  running: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, TestResults>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTargetType, setNewTargetType] = useState('page')
  const [newVariants, setNewVariants] = useState([
    { id: 'A', name: 'Control', weight: 50, config: {} },
    { id: 'B', name: 'Variant B', weight: 50, config: {} },
  ])

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ab-tests')
      if (res.ok) {
        const data = await res.json()
        setTests(data.tests ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTests() }, [fetchTests])

  async function fetchResults(testId: string) {
    const res = await fetch(`/api/admin/ab-tests/${testId}`)
    if (res.ok) {
      const data = await res.json()
      setResults((prev) => ({ ...prev, [testId]: data.results }))
    }
  }

  async function toggleExpand(testId: string) {
    if (expandedId === testId) {
      setExpandedId(null)
    } else {
      setExpandedId(testId)
      if (!results[testId]) await fetchResults(testId)
    }
  }

  async function updateStatus(testId: string, status: string, winnerId?: string) {
    setActionLoading(testId)
    try {
      await fetch(`/api/admin/ab-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, winnerId }),
      })
      await fetchTests()
      if (expandedId === testId) await fetchResults(testId)
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteTest(testId: string) {
    if (!confirm('Delete this A/B test?')) return
    setActionLoading(testId)
    try {
      await fetch(`/api/admin/ab-tests/${testId}`, { method: 'DELETE' })
      fetchTests()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setActionLoading('create')
    try {
      const res = await fetch('/api/admin/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          targetType: newTargetType,
          variants: newVariants,
        }),
      })
      if (res.ok) {
        setNewName('')
        setNewDesc('')
        setNewVariants([
          { id: 'A', name: 'Control', weight: 50, config: {} },
          { id: 'B', name: 'Variant B', weight: 50, config: {} },
        ])
        setShowCreate(false)
        fetchTests()
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">A/B Tests</h1>
        </div>
        <WarmButton size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          New Test
        </WarmButton>
      </div>

      {showCreate && (
        <WarmCard>
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Create A/B Test</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Test Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. checkout-button-color"
                  required
                />
              </div>
              <div>
                <Label>Target Type</Label>
                <select
                  value={newTargetType}
                  onChange={(e) => setNewTargetType(e.target.value)}
                  className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                >
                  <option value="page">Page</option>
                  <option value="campaign">Campaign</option>
                  <option value="voucher">Voucher</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What are you testing?"
              />
            </div>

            <div>
              <Label>Variants</Label>
              <div className="space-y-2 mt-1">
                {newVariants.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <Input
                      value={v.id}
                      onChange={(e) => {
                        const updated = [...newVariants]
                        updated[i] = { ...v, id: e.target.value }
                        setNewVariants(updated)
                      }}
                      className="w-20"
                      placeholder="ID"
                    />
                    <Input
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...newVariants]
                        updated[i] = { ...v, name: e.target.value }
                        setNewVariants(updated)
                      }}
                      placeholder="Name"
                    />
                    <Input
                      type="number"
                      value={v.weight}
                      onChange={(e) => {
                        const updated = [...newVariants]
                        updated[i] = { ...v, weight: Number(e.target.value) }
                        setNewVariants(updated)
                      }}
                      className="w-24"
                      placeholder="Weight"
                      min={1}
                    />
                    {newVariants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setNewVariants(newVariants.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewVariants([
                      ...newVariants,
                      {
                        id: String.fromCharCode(65 + newVariants.length),
                        name: `Variant ${String.fromCharCode(65 + newVariants.length)}`,
                        weight: 50,
                        config: {},
                      },
                    ])
                  }
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  + Add variant
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <WarmButton type="submit" size="sm" isLoading={actionLoading === 'create'}>
                Create Test
              </WarmButton>
              <WarmButton type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-[var(--text-muted)]">Loading tests...</p>
      ) : tests.length === 0 ? (
        <WarmCard>
          <p className="text-center text-[var(--text-muted)] py-8">
            No A/B tests yet. Create one to get started.
          </p>
        </WarmCard>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <WarmCard key={test.id}>
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleExpand(test.id)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text)]">{test.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[test.status]}`}>
                      {test.status}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {test.targetType}
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">{test.description}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {test.assignmentCount} assignments
                    {test.variants && ` | ${(test.variants as Variant[]).length} variants`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {test.status === 'draft' && (
                    <WarmButton
                      size="icon"
                      variant="ghost"
                      onClick={() => updateStatus(test.id, 'running')}
                      disabled={actionLoading === test.id}
                      title="Start"
                    >
                      <Play className="h-4 w-4 text-green-600" />
                    </WarmButton>
                  )}
                  {test.status === 'running' && (
                    <>
                      <WarmButton
                        size="icon"
                        variant="ghost"
                        onClick={() => updateStatus(test.id, 'paused')}
                        disabled={actionLoading === test.id}
                        title="Pause"
                      >
                        <Pause className="h-4 w-4 text-yellow-600" />
                      </WarmButton>
                      <WarmButton
                        size="icon"
                        variant="ghost"
                        onClick={() => updateStatus(test.id, 'completed')}
                        disabled={actionLoading === test.id}
                        title="Complete"
                      >
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </WarmButton>
                    </>
                  )}
                  {test.status === 'paused' && (
                    <WarmButton
                      size="icon"
                      variant="ghost"
                      onClick={() => updateStatus(test.id, 'running')}
                      disabled={actionLoading === test.id}
                      title="Resume"
                    >
                      <Play className="h-4 w-4 text-green-600" />
                    </WarmButton>
                  )}
                  <WarmButton
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTest(test.id)}
                    disabled={actionLoading === test.id}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </WarmButton>
                </div>
              </div>

              {expandedId === test.id && results[test.id] && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                    <h4 className="font-medium text-[var(--text)]">Results</h4>
                    {results[test.id].significance !== null && (
                      <span className="text-xs text-[var(--text-muted)]">
                        p-value: {results[test.id].significance!.toFixed(4)}
                        {results[test.id].significance! < 0.05 && (
                          <span className="ml-1 text-green-600 font-medium">Significant</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {results[test.id].variants.map((v) => {
                      const maxImpressions = Math.max(
                        ...results[test.id].variants.map((x) => x.impressions ?? 0),
                        1
                      )
                      const barWidth = ((v.impressions ?? 0) / maxImpressions) * 100
                      const convRate = ((v.conversionRate ?? 0) * 100).toFixed(1)

                      return (
                        <div key={v.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[var(--text)]">
                              {v.name} ({v.id})
                              {results[test.id].winnerId === v.id && (
                                <span className="ml-1 text-green-600 text-xs">Winner</span>
                              )}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {v.impressions ?? 0} imp / {v.conversions ?? 0} conv ({convRate}%)
                            </span>
                          </div>
                          <div className="h-4 bg-[var(--surface-dim)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: v.id === results[test.id].winnerId
                                  ? 'var(--success, #22c55e)'
                                  : 'var(--primary)',
                                opacity: 0.8,
                              }}
                            />
                          </div>
                          {/* Conversion rate bar */}
                          <div className="h-2 bg-[var(--surface-dim)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                              style={{ width: `${Math.min(100, (v.conversionRate ?? 0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  )
}
