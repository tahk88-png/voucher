"use client"

import { useMemo, useState } from "react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PAGE_ADDON_CATALOG,
  PAGE_SECTION_CATALOG,
  type PageBuilderConfig,
  type PageBuilderType,
} from "@/lib/page-builder"
import { showError, showSuccess } from "@/lib/toast-helpers"
import { Bot, Save, Sparkles } from "lucide-react"
import DragDropEditor, { type SectionSettings } from "./drag-drop-editor"

type AgentResult = {
  title: string
  steps: Array<{
    task: string
    outcome?: string
  }>
}

type VibeResponse = {
  title: string
  subtitle?: string
  sections: string[]
  addons: string[]
}

type UsageInfo = {
  remaining: number
  limit: number
  resetAt?: string
}

interface PageBuilderClientProps {
  merchantSlug: string
  merchantName: string
  initialPages: PageBuilderConfig[]
}

const processOptions = [
  {
    id: "store_launch",
    label: "Storefront launch checklist",
    goal: "Launch a store page with vouchers, campaigns, and clean checkout flow.",
  },
  {
    id: "rental_launch",
    label: "Rental page launch checklist",
    goal: "Launch a rental page with availability, deposit, and pickup flow.",
  },
  {
    id: "campaign_ops",
    label: "Weekly campaign operations",
    goal: "Keep weekly campaigns fresh, with promotion and analytics tasks.",
  },
  {
    id: "support_ops",
    label: "Support readiness checklist",
    goal: "Set up support, FAQs, and response templates for customers.",
  },
]

export default function PageBuilderClient({
  merchantSlug,
  merchantName,
  initialPages,
}: PageBuilderClientProps) {
  const [pages, setPages] = useState<PageBuilderConfig[]>(initialPages)
  const [activeType, setActiveType] = useState<PageBuilderType>("store")
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentGoal, setAgentGoal] = useState(processOptions[0].id)
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null)
  const [vibeUsage, setVibeUsage] = useState<UsageInfo | null>(null)
  const [agentUsage, setAgentUsage] = useState<UsageInfo | null>(null)
  const [sectionSettings, setSectionSettings] = useState<Record<string, SectionSettings>>({})

  const activePage = useMemo(() => {
    return pages.find((page) => page.type === activeType)
  }, [pages, activeType])

  const sectionOptions = useMemo(() => {
    return PAGE_SECTION_CATALOG.filter((section) => section.types.includes(activeType))
  }, [activeType])

  const updatePage = (patch: Partial<PageBuilderConfig>) => {
    setPages((prev) =>
      prev.map((page) =>
        page.type === activeType ? { ...page, ...patch } : page
      )
    )
  }

  const toggleAddon = (id: string) => {
    if (!activePage) return
    const exists = activePage.addons.includes(id)
    const next = exists
      ? activePage.addons.filter((addon) => addon !== id)
      : [...activePage.addons, id]
    updatePage({ addons: next })
  }

  const handleSave = async () => {
    if (!activePage) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/page-builder?type=${activeType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePage),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save page")
      }
      const updated = payload.page as PageBuilderConfig
      setPages((prev) =>
        prev.map((page) => (page.type === activeType ? { ...page, ...updated } : page))
      )
      showSuccess("Page builder updated.")
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save page")
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (!activePage) return
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "builder_layout",
          pageType: activeType,
          brandName: merchantName,
          tone: "warm, premium, conversion-focused",
          language: "en",
          availableSections: sectionOptions.map((section) => section.id),
          availableAddons: PAGE_ADDON_CATALOG.map((addon) => addon.id),
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setVibeUsage(payload.usage || null)
        throw new Error(payload.error || "Vibe agent failed")
      }
      const content = payload.content as VibeResponse
      const filteredSections = content.sections.filter((id) =>
        sectionOptions.some((section) => section.id === id)
      )
      const filteredAddons = content.addons.filter((id) =>
        PAGE_ADDON_CATALOG.some((addon) => addon.id === id)
      )
      updatePage({
        title: content.title || activePage.title,
        subtitle: content.subtitle || activePage.subtitle,
        sections: filteredSections.length > 0 ? filteredSections : activePage.sections,
        addons: filteredAddons,
      })
      setVibeUsage(payload.usage || null)
      showSuccess("Vibe layout generated.")
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to generate layout")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAgentRun = async () => {
    setAgentLoading(true)
    try {
      const selected = processOptions.find((option) => option.id === agentGoal)
      const res = await fetch(`/api/merchant/${merchantSlug}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "ops_assistant",
          brandName: merchantName,
          tone: "clear, operational, checklist",
          language: "en",
          goal: selected?.goal || "Launch the page efficiently.",
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setAgentUsage(payload.usage || null)
        throw new Error(payload.error || "Agent failed")
      }
      setAgentResult(payload.content as AgentResult)
      setAgentUsage(payload.usage || null)
      showSuccess("Process plan generated.")
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to run agent")
    } finally {
      setAgentLoading(false)
    }
  }

  if (!activePage) {
    return (
      <div className="max-w-4xl mx-auto">
        <WarmCard padding="lg">No page builder data available.</WarmCard>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[var(--text)]">Page Builder</h1>
        <p className="text-[var(--text-muted)]">
          Build fast storefront and rental pages with modular sections, add-ons, and AI help.
        </p>
      </div>

      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as PageBuilderType)}>
        <TabsList className="bg-[var(--surface)] border border-[var(--border)]">
          <TabsTrigger value="store">Storefront</TabsTrigger>
          <TabsTrigger value="rental">Rental</TabsTrigger>
        </TabsList>

        {(["store", "rental"] as PageBuilderType[]).map((type) => (
          <TabsContent value={type} key={type}>
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                {/* Page details */}
                <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text)]">Page details</h2>
                      <p className="text-sm text-[var(--text-muted)]">Title, subtitle, and layout.</p>
                    </div>
                    <WarmButton onClick={handleSave} isLoading={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </WarmButton>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="page-builder-title" className="text-sm font-medium text-[var(--text)]">
                        Page title
                      </label>
                      <Input
                        id="page-builder-title"
                        value={activePage.title}
                        onChange={(event) => updatePage({ title: event.target.value })}
                        className="border-[var(--border)]"
                      />
                    </div>
                    <div>
                      <label htmlFor="page-builder-subtitle" className="text-sm font-medium text-[var(--text)]">
                        Subtitle
                      </label>
                      <Input
                        id="page-builder-subtitle"
                        value={activePage.subtitle || ""}
                        onChange={(event) => updatePage({ subtitle: event.target.value })}
                        className="border-[var(--border)]"
                      />
                    </div>
                  </div>
                </WarmCard>

                {/* Visual drag-drop editor */}
                <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text)]">Sections</h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        Drag to reorder, expand to configure, or preview your layout.
                      </p>
                    </div>
                    <WarmButton variant="outline" onClick={handleGenerate} isLoading={isGenerating}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Vibe generate
                    </WarmButton>
                  </div>
                  {vibeUsage && (
                    <p className="text-xs text-[var(--text-faint)] mb-4">
                      Vibe uses left: {vibeUsage.remaining}/{vibeUsage.limit}
                    </p>
                  )}
                  <DragDropEditor
                    sections={activePage.sections}
                    activeType={activeType}
                    sectionSettings={sectionSettings}
                    onSectionsChange={(sections) => updatePage({ sections })}
                    onSectionSettingsChange={setSectionSettings}
                  />
                </WarmCard>

                {/* Add-ons */}
                <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Add-ons</h2>
                  <p className="text-sm text-[var(--text-muted)] mb-4">Extra widgets and marketing layers.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAGE_ADDON_CATALOG.map((addon) => {
                      const enabled = activePage.addons.includes(addon.id)
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`text-left rounded-[14px] border px-4 py-3 transition-all ${
                            enabled
                              ? "border-[var(--primary)] bg-[var(--bg-2)]"
                              : "border-[#F2EDE3] bg-[var(--surface)] hover:border-[var(--primary)]"
                          }`}
                          aria-pressed={enabled}
                          aria-label={`${enabled ? "Disable" : "Enable"} add-on ${addon.label}`}
                        >
                          <div className="font-medium text-[var(--text)]">{addon.label}</div>
                          <div className="text-xs text-[var(--text-faint)] mt-1">{addon.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </WarmCard>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <h3 className="text-base font-semibold text-[var(--text)] mb-2">Live summary</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    {activePage.title} - {activePage.sections.length} sections - {activePage.addons.length} add-ons
                  </p>
                  <div className="space-y-2 text-xs text-[var(--text-faint)]">
                    <div>
                      <span className="font-semibold text-[var(--text)]">Sections:</span>{" "}
                      {activePage.sections.join(", ")}
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--text)]">Add-ons:</span>{" "}
                      {activePage.addons.length ? activePage.addons.join(", ") : "None"}
                    </div>
                  </div>
                </WarmCard>

                <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-[var(--danger)]" />
                  <h3 className="text-base font-semibold text-[var(--text)]">GPT process agent</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Generate action plans and operational checklists.
                </p>
                <label htmlFor="page-builder-agent-goal" className="text-sm font-medium text-[var(--text)]">
                  Process goal
                </label>
                <select
                  id="page-builder-agent-goal"
                  value={agentGoal}
                  onChange={(event) => setAgentGoal(event.target.value)}
                  className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                  >
                    {processOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <WarmButton
                    onClick={handleAgentRun}
                    isLoading={agentLoading}
                    variant="outline"
                    className="w-full mt-3"
                  >
                    Run agent
                  </WarmButton>
                  {agentUsage && (
                    <p className="text-xs text-[var(--text-faint)] mt-2">
                      Agent uses left: {agentUsage.remaining}/{agentUsage.limit}
                    </p>
                  )}
                </WarmCard>

                {agentResult && (
                  <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                      {agentResult.title}
                    </h3>
                    <div className="space-y-3 text-sm text-[var(--text-muted)]">
                      {agentResult.steps.map((step, index) => (
                        <div key={`${step.task}-${index}`}>
                          <div className="font-semibold text-[var(--text)]">
                            {index + 1}. {step.task}
                          </div>
                          {step.outcome ? (
                            <div className="text-xs text-[var(--text-faint)]">{step.outcome}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </WarmCard>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
