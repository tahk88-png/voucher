"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-bold text-[#2D2721]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 text-[#6B5744] hover:text-[#2D2721]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#8B7355] rounded-md w-9 font-medium text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[#FAF7F2]/50 [&:has([aria-selected])]:bg-[#FAF7F2] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#FAF7F2] hover:text-[#2D2721]"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] hover:bg-gradient-to-br hover:from-[#FFC857] hover:to-[#FFB627] hover:text-[#2D2721] focus:bg-gradient-to-br focus:from-[#FFC857] focus:to-[#FFB627] focus:text-[#2D2721]",
        day_today: "bg-[#FAF7F2] text-[#2D2721] font-bold",
        day_outside:
          "day-outside text-[#8B7355]/50 opacity-50 aria-selected:bg-[#FAF7F2]/50 aria-selected:text-[#8B7355] aria-selected:opacity-30",
        day_disabled: "text-[#8B7355]/50 opacity-50",
        day_range_middle:
          "aria-selected:bg-[#FAF7F2] aria-selected:text-[#2D2721]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
