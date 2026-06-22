"use client"

import * as React from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch?: (value: string) => void
  onChange?: (value: string) => void
  onClear?: () => void
  isLoading?: boolean
  debounceMs?: number
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    className,
    onSearch,
    onChange,
    onClear,
    isLoading,
    debounceMs = 300,
    ...props
  }, ref) => {
    const [value, setValue] = React.useState("")
    const debounceTimer = React.useRef<NodeJS.Timeout>()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      onChange?.(newValue)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        onSearch?.(newValue)
      }, debounceMs)
    }

    const handleClear = () => {
      setValue("")
      onChange?.("")
      onSearch?.("")
      onClear?.()
    }

    React.useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
      }
    }, [])

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={handleChange}
          className={cn("pl-9 pr-9", className)}
          {...props}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--primary)]" />
        )}
        {!isLoading && value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"
