"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@app/components/ui/label";
import { Input } from "@app/components/ui/input";
import { cn } from "@app/components/ui/utils";

interface TimePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  className?: string;
  onChange?: (time: string) => void;
  value?: string; // "HH:MM"
}

export function TimePicker({ date, setDate, className, onChange, value }: TimePickerProps) {
  const [hours, setHours] = React.useState<string>("12");
  const [minutes, setMinutes] = React.useState<string>("00");

  // Initialize from date or value
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHours(h || "00");
      setMinutes(m || "00");
    } else if (date) {
      setHours(date.getHours().toString().padStart(2, "0"));
      setMinutes(date.getMinutes().toString().padStart(2, "0"));
    }
  }, [date, value]);

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    let newValue = val;
    // Allow numeric only
    if (!/^\d*$/.test(newValue)) return;

    if (type === "hours") {
      if (parseInt(newValue) > 23) newValue = "23";
      setHours(newValue);
    } else {
      if (parseInt(newValue) > 59) newValue = "59";
      setMinutes(newValue);
    }

    // Update parent
    if (newValue.length === 2 || (type === "hours" && parseInt(newValue) > 2)) {
      const h = type === "hours" ? newValue.padStart(2, "0") : hours.padStart(2, "0");
      const m = type === "minutes" ? newValue.padStart(2, "0") : minutes.padStart(2, "0");
      
      if (onChange) {
        onChange(`${h}:${m}`);
      }
      if (setDate && date) {
        const newDate = new Date(date);
        newDate.setHours(parseInt(h));
        newDate.setMinutes(parseInt(m));
        setDate(newDate);
      }
    }
  };

  const handleBlur = (type: "hours" | "minutes") => {
    if (type === "hours") {
      const h = hours.padStart(2, "0");
      setHours(h);
      if (onChange) onChange(`${h}:${minutes.padStart(2, "0")}`);
    } else {
      const m = minutes.padStart(2, "0");
      setMinutes(m);
      if (onChange) onChange(`${hours.padStart(2, "0")}:${m}`);
    }
  };

  return (
    <div className={cn("flex items-end gap-2", className)}>
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs text-[#8B7355] font-medium">Hours</Label>
        <div className="relative">
            <Input
              id="hours"
              className="w-16 text-center text-lg font-mono bg-white border-[#E7DCC7] focus:border-[#FFC857] focus:ring-[#FFC857] h-12 rounded-xl"
              value={hours}
              onChange={(e) => handleTimeChange("hours", e.target.value)}
              onBlur={() => handleBlur("hours")}
              maxLength={2}
            />
        </div>
      </div>
      <div className="flex items-center justify-center h-12 text-[#2D2721] font-bold pb-1">:</div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs text-[#8B7355] font-medium">Minutes</Label>
        <div className="relative">
            <Input
              id="minutes"
              className="w-16 text-center text-lg font-mono bg-white border-[#E7DCC7] focus:border-[#FFC857] focus:ring-[#FFC857] h-12 rounded-xl"
              value={minutes}
              onChange={(e) => handleTimeChange("minutes", e.target.value)}
              onBlur={() => handleBlur("minutes")}
              maxLength={2}
            />
        </div>
      </div>
      <div className="flex h-12 items-center justify-center ml-2">
        <Clock className="h-5 w-5 text-[#8B7355]" />
      </div>
    </div>
  );
}
