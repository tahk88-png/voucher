"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SearchInput } from "@/components/ui/search-input"
import { cn } from "@/lib/utils"
import { Command } from "lucide-react"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  onSelect: () => void
  category?: string
}

interface CommandPaletteProps {
  items: CommandItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
}

export function CommandPalette({
  items,
  open,
  onOpenChange,
  placeholder = "Search...",
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")

  const filteredItems = React.useMemo(() => {
    if (!query) return items

    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    )
  }, [items, query])

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredItems.forEach((item) => {
      const category = item.category || "Other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })
    return groups
  }, [filteredItems])

  const handleSelect = (item: CommandItem) => {
    item.onSelect()
    onOpenChange(false)
    setQuery("")
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="p-4 border-b border-[#E7DCC7]">
          <SearchInput
            placeholder={placeholder}
            onChange={setQuery}
            autoFocus
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="mb-4">
              <div className="px-2 py-1.5 text-xs font-semibold text-[#8B7355]">
                {category}
              </div>
              <div className="space-y-1">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-[8px] hover:bg-[#FAF7F2] transition-colors text-left"
                  >
                    {item.icon && (
                      <div className="flex-shrink-0 text-[#8B7355]">
                        {item.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2D2721] truncate">
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-xs text-[#6B5744] truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && query && (
            <div className="py-12 text-center text-sm text-[#8B7355]">
              No results found
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E7DCC7] bg-[#FAF7F2]">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#E7DCC7] bg-white px-1.5 font-mono text-[10px] font-medium text-[#8B7355]">
            <span className="text-xs">⌘</span>K
          </kbd>
          <span className="text-xs text-[#8B7355]">to open</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  return {
    open,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
  }
}
