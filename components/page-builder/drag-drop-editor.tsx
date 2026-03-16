"use client"

import { useCallback, useRef, useState } from "react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  Edit2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { PAGE_SECTION_CATALOG } from "@/lib/page-builder"
import type { PageBuilderType } from "@/lib/page-builder"
import { SectionPreview, getSectionIcon, getSectionColor } from "./section-preview"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SectionSettings {
  title?: string
  description?: string
  bgColor?: string
  layoutVariant?: "default" | "centered" | "wide" | "compact"
}

interface DragDropEditorProps {
  sections: string[]
  activeType: PageBuilderType
  sectionSettings: Record<string, SectionSettings>
  onSectionsChange: (sections: string[]) => void
  onSectionSettingsChange: (settings: Record<string, SectionSettings>) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DragDropEditor({
  sections,
  activeType,
  sectionSettings,
  onSectionsChange,
  onSectionSettingsChange,
}: DragDropEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const dragNodeRef = useRef<HTMLDivElement | null>(null)

  const availableSections = PAGE_SECTION_CATALOG.filter((s) =>
    s.types.includes(activeType)
  )

  const catalogLabel = (id: string) =>
    PAGE_SECTION_CATALOG.find((s) => s.id === id)?.label ?? id

  const catalogDescription = (id: string) =>
    PAGE_SECTION_CATALOG.find((s) => s.id === id)?.description ?? ""

  /* ---- drag handlers ---- */

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDragIndex(index)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", String(index))
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.4"
      }
    },
    []
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDropTarget(null)
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1"
    }
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (dragIndex !== null && index !== dragIndex) {
        setDropTarget(index)
      }
    },
    [dragIndex]
  )

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === toIndex) {
        setDropTarget(null)
        return
      }
      const next = [...sections]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(toIndex > dragIndex ? toIndex - 1 : toIndex, 0, moved)
      onSectionsChange(next)
      setDragIndex(null)
      setDropTarget(null)
    },
    [dragIndex, sections, onSectionsChange]
  )

  /* ---- drop zone between sections ---- */

  const handleZoneDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDropTarget(index)
    },
    []
  )

  const handleZoneDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
      e.preventDefault()
      if (dragIndex === null) return
      const next = [...sections]
      const [moved] = next.splice(dragIndex, 1)
      const adjustedIndex = toIndex > dragIndex ? toIndex - 1 : toIndex
      next.splice(adjustedIndex, 0, moved)
      onSectionsChange(next)
      setDragIndex(null)
      setDropTarget(null)
    },
    [dragIndex, sections, onSectionsChange]
  )

  /* ---- section CRUD ---- */

  const addSection = useCallback(
    (id: string) => {
      if (!sections.includes(id)) {
        onSectionsChange([...sections, id])
      }
      setCatalogOpen(false)
    },
    [sections, onSectionsChange]
  )

  const removeSection = useCallback(
    (index: number) => {
      const next = [...sections]
      const removedId = next[index]
      next.splice(index, 1)
      onSectionsChange(next)
      if (expandedSection === removedId) setExpandedSection(null)
      // Clean up settings
      const newSettings = { ...sectionSettings }
      delete newSettings[removedId]
      onSectionSettingsChange(newSettings)
    },
    [sections, onSectionsChange, expandedSection, sectionSettings, onSectionSettingsChange]
  )

  const updateSetting = useCallback(
    (sectionId: string, key: keyof SectionSettings, value: string) => {
      onSectionSettingsChange({
        ...sectionSettings,
        [sectionId]: {
          ...sectionSettings[sectionId],
          [key]: value,
        },
      })
    },
    [sectionSettings, onSectionSettingsChange]
  )

  const toggleExpand = (sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId))
  }

  /* ---- not-yet-added sections for catalog ---- */

  const unaddedSections = availableSections.filter(
    (s) => !sections.includes(s.id)
  )

  /* ---- preview mode ---- */

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">Preview</h2>
          <WarmButton variant="outline" size="sm" onClick={() => setPreviewMode(false)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </WarmButton>
        </div>
        <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
          <div className="space-y-4">
            {sections.length === 0 && (
              <p className="text-center text-[var(--text-muted)] py-8">
                No sections added yet. Switch to edit mode to add sections.
              </p>
            )}
            {sections.map((sectionId) => {
              const label = catalogLabel(sectionId)
              const settings = sectionSettings[sectionId]
              return (
                <div key={sectionId} className="border border-[var(--border)] rounded-xl p-4">
                  {settings?.title && (
                    <p className="text-sm font-semibold text-[var(--text)] mb-1">
                      {settings.title}
                    </p>
                  )}
                  {settings?.description && (
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                      {settings.description}
                    </p>
                  )}
                  <SectionPreview sectionId={sectionId} label={label} />
                </div>
              )
            })}
          </div>
        </WarmCard>
      </div>
    )
  }

  /* ---- edit mode ---- */

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text)]">Visual editor</h2>
        <div className="flex items-center gap-2">
          <WarmButton variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </WarmButton>
        </div>
      </div>

      {/* Section list with drag-and-drop */}
      <div className="space-y-0">
        {sections.length === 0 && (
          <WarmCard padding="lg" className="border border-dashed border-[var(--border)] bg-transparent text-center">
            <p className="text-[var(--text-muted)] text-sm">
              No sections yet. Click &quot;Add section&quot; below to start building.
            </p>
          </WarmCard>
        )}

        {sections.map((sectionId, index) => {
          const label = catalogLabel(sectionId)
          const description = catalogDescription(sectionId)
          const isExpanded = expandedSection === sectionId
          const isDragging = dragIndex === index
          const isDropTarget = dropTarget === index
          const SectionIcon = getSectionIcon(sectionId)
          const sectionColor = getSectionColor(sectionId)
          const settings = sectionSettings[sectionId]

          return (
            <div key={sectionId}>
              {/* Drop zone above */}
              <div
                className="h-1.5 mx-4 rounded-full transition-all duration-150"
                style={{
                  background: isDropTarget && dragIndex !== null && dragIndex !== index
                    ? "var(--primary)"
                    : "transparent",
                  height: isDropTarget && dragIndex !== null && dragIndex !== index
                    ? "4px"
                    : "2px",
                  margin: isDropTarget && dragIndex !== null && dragIndex !== index
                    ? "4px 16px"
                    : "0 16px",
                }}
                onDragOver={(e) => handleZoneDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleZoneDrop(e, index)}
              />

              {/* Section card */}
              <div
                ref={isDragging ? dragNodeRef : undefined}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className="transition-all duration-150"
                style={{ opacity: isDragging ? 0.4 : 1 }}
              >
                <WarmCard
                  padding="none"
                  className={`bg-[var(--surface)] border mb-0 ${
                    isDragging
                      ? "border-[var(--primary)] shadow-lg"
                      : "border-[var(--border)]"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text)] touch-none">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Icon */}
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: sectionColor + "18" }}
                    >
                      <SectionIcon className="h-4 w-4" style={{ color: sectionColor }} />
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">
                        {settings?.title || label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {description}
                      </p>
                    </div>

                    {/* Order badge */}
                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-dim)] rounded px-1.5 py-0.5 shrink-0">
                      {index + 1}
                    </span>

                    {/* Expand / collapse */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(sectionId)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-dim)] transition-colors"
                      aria-label={isExpanded ? "Collapse settings" : "Expand settings"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors group"
                      aria-label={`Remove ${label} section`}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--text-muted)] group-hover:text-red-500" />
                    </button>
                  </div>

                  {/* Expanded settings panel */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Mini preview */}
                        <div className="sm:col-span-2">
                          <div className="rounded-xl border border-[var(--border)] p-3 bg-[var(--surface-dim)]/50">
                            <SectionPreview sectionId={sectionId} label={label} />
                          </div>
                        </div>

                        {/* Title override */}
                        <div>
                          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                            Section title
                          </label>
                          <Input
                            value={settings?.title ?? ""}
                            onChange={(e) => updateSetting(sectionId, "title", e.target.value)}
                            placeholder={label}
                            className="border-[var(--border)] text-sm h-9"
                          />
                        </div>

                        {/* Description override */}
                        <div>
                          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                            Description
                          </label>
                          <Input
                            value={settings?.description ?? ""}
                            onChange={(e) => updateSetting(sectionId, "description", e.target.value)}
                            placeholder="Optional description"
                            className="border-[var(--border)] text-sm h-9"
                          />
                        </div>

                        {/* Background color */}
                        <div>
                          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                            Background color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={settings?.bgColor ?? "#ffffff"}
                              onChange={(e) => updateSetting(sectionId, "bgColor", e.target.value)}
                              className="h-9 w-9 rounded border border-[var(--border)] cursor-pointer"
                            />
                            <Input
                              value={settings?.bgColor ?? ""}
                              onChange={(e) => updateSetting(sectionId, "bgColor", e.target.value)}
                              placeholder="#ffffff"
                              className="border-[var(--border)] text-sm h-9 flex-1"
                            />
                          </div>
                        </div>

                        {/* Layout variant */}
                        <div>
                          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                            Layout variant
                          </label>
                          <select
                            value={settings?.layoutVariant ?? "default"}
                            onChange={(e) =>
                              updateSetting(
                                sectionId,
                                "layoutVariant",
                                e.target.value as SectionSettings["layoutVariant"] & string
                              )
                            }
                            className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                          >
                            <option value="default">Default</option>
                            <option value="centered">Centered</option>
                            <option value="wide">Wide</option>
                            <option value="compact">Compact</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </WarmCard>
              </div>
            </div>
          )
        })}

        {/* Final drop zone */}
        {sections.length > 0 && (
          <div
            className="h-1.5 mx-4 rounded-full transition-all duration-150"
            style={{
              background:
                dropTarget === sections.length && dragIndex !== null
                  ? "var(--primary)"
                  : "transparent",
              height:
                dropTarget === sections.length && dragIndex !== null
                  ? "4px"
                  : "2px",
              margin:
                dropTarget === sections.length && dragIndex !== null
                  ? "4px 16px"
                  : "0 16px",
            }}
            onDragOver={(e) => handleZoneDragOver(e, sections.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleZoneDrop(e, sections.length)}
          />
        )}
      </div>

      {/* Add section button + catalog dropdown */}
      <div className="relative">
        <WarmButton
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setCatalogOpen((prev) => !prev)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add section
        </WarmButton>

        {catalogOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setCatalogOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute z-50 mt-2 left-0 right-0 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Available sections
                  </span>
                  <button
                    type="button"
                    onClick={() => setCatalogOpen(false)}
                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-[var(--surface-dim)]"
                  >
                    <X className="h-3 w-3 text-[var(--text-muted)]" />
                  </button>
                </div>

                {unaddedSections.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">
                    All available sections have been added.
                  </p>
                ) : (
                  unaddedSections.map((section) => {
                    const SIcon = getSectionIcon(section.id)
                    const sColor = getSectionColor(section.id)
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => addSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--surface-dim)] transition-colors"
                      >
                        <div
                          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: sColor + "18" }}
                        >
                          <SIcon className="h-3.5 w-3.5" style={{ color: sColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">
                            {section.label}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {section.description}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-[var(--text-muted)] shrink-0 ml-auto" />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section count */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        {sections.length} section{sections.length !== 1 ? "s" : ""} configured
        {" / "}
        {unaddedSections.length} available to add
      </p>
    </div>
  )
}
