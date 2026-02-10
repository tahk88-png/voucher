import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-11 w-full min-w-0 rounded-[12px] border bg-white px-3.5 py-2 text-sm text-[#2D2721] shadow-sm transition-[color,box-shadow,border-color] outline-none",
        "placeholder:text-[#8B7355]/70 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:border-[#FFC857] focus-visible:ring-2 focus-visible:ring-[#FFC857]/25",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#FAF7F2] disabled:text-[#8B7355] disabled:opacity-60",
        "aria-invalid:border-[#E17B5C] aria-invalid:ring-2 aria-invalid:ring-[#E17B5C]/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
