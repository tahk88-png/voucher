import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-y border-input placeholder:text-[#8B7355]/70 flex min-h-[120px] w-full rounded-[12px] border bg-white px-3.5 py-2.5 text-sm text-[#2D2721] shadow-sm transition-[color,box-shadow,border-color] outline-none",
        "focus-visible:border-[#FFC857] focus-visible:ring-2 focus-visible:ring-[#FFC857]/25",
        "disabled:cursor-not-allowed disabled:bg-[#FAF7F2] disabled:text-[#8B7355] disabled:opacity-60",
        "aria-invalid:border-[#E17B5C] aria-invalid:ring-2 aria-invalid:ring-[#E17B5C]/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
