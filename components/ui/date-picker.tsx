"use client"

import * as React from "react"
import { format } from "date-fns"
import { et as etLocale } from "date-fns/locale"
import { useLocale, useTranslations } from "next-intl"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onSelect,
  placeholder,
  disabled,
  className,
}: DatePickerProps) {
  const t = useTranslations("ui")
  const locale = useLocale()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <WarmButton
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-[var(--text-faint)]",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP", locale === "et" ? { locale: etLocale } : undefined)
          ) : (
            <span>{placeholder ?? t("datePicker.placeholder")}</span>
          )}
        </WarmButton>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
