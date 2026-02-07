"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-2xl border border-[#E7DCC7] shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full mb-2",
        caption_label: "text-base font-semibold text-[#2D2721] font-dm-sans",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 text-[#8B7355] hover:text-[#2D2721] hover:bg-[#FFF9ED] border-[#E7DCC7] rounded-full transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full mb-2",
        head_cell:
          "text-[#8B7355] rounded-md w-9 font-medium text-[0.8rem] uppercase tracking-wider",
        row: "flex w-full mt-2 gap-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#FFF9ED] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[#2D2721] hover:bg-[#FFF9ED] hover:text-[#2D2721] rounded-full transition-all"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-[#FFC857] aria-selected:text-[#2D2721]",
        day_range_end:
          "day-range-end aria-selected:bg-[#FFC857] aria-selected:text-[#2D2721]",
        day_selected:
          "bg-[#FFC857] text-[#2D2721] hover:bg-[#FFB627] hover:text-[#2D2721] focus:bg-[#FFC857] focus:text-[#2D2721] font-medium shadow-sm",
        day_today: "bg-[#F2EDE3] text-[#2D2721] font-medium border border-[#E7DCC7]",
        day_outside:
          "day-outside text-[#D4C5B5] opacity-50 aria-selected:bg-transparent aria-selected:text-[#D4C5B5] aria-selected:opacity-30",
        day_disabled: "text-[#D4C5B5] opacity-50",
        day_range_middle:
          "aria-selected:bg-[#FFF9ED] aria-selected:text-[#2D2721]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
