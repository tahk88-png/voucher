import * as React from 'react';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ 
  date, 
  setDate, 
  label, 
  placeholder = "Vali kuupäev",
  className 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs font-bold uppercase text-[#8B7355] tracking-wider">{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-[#FAF7F2] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E17B5C]/20",
              date ? "text-[#2D2721] border-[#E17B5C] bg-[#FFF9ED]" : "text-[#8B7355] border-[#E7DCC7] hover:border-[#D4C5A8]"
            )}
          >
            <span className={cn(!date && "opacity-70")}>
              {date ? format(date, "PPP", { locale: et }) : placeholder}
            </span>
            <CalendarIcon className={cn("w-4 h-4 ml-2", date ? "text-[#E17B5C]" : "text-[#8B7355]")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-[#E7DCC7] rounded-2xl shadow-warm-lg" align="start">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setIsOpen(false);
            }}
            locale={et}
            showOutsideDays
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-bold text-[#2D2721]",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-[#FFF9ED] rounded-lg flex items-center justify-center transition-colors text-[#8B7355]",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-[#8B7355] rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#FFF9ED] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#FAF7F2] rounded-md transition-colors text-[#2D2721]",
              day_selected: "bg-[#E17B5C] !text-white hover:bg-[#E17B5C] hover:text-white focus:bg-[#E17B5C] focus:text-white shadow-warm",
              day_today: "bg-[#FAF7F2] text-[#E17B5C] font-bold border border-[#E7DCC7]",
              day_outside: "text-[#D4C5A8] opacity-50",
              day_disabled: "text-[#D4C5A8] opacity-50",
              day_range_middle: "aria-selected:bg-[#FFF9ED] aria-selected:text-[#2D2721]",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}