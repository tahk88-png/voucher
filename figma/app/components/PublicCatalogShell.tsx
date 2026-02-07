import type { ReactNode } from "react";
import { GlobalNavigation } from "@/figma/app/components/GlobalNavigation";
import { cn } from "@/figma/lib/utils";

interface PublicCatalogShellProps {
  children: ReactNode;
  className?: string;
}

export function PublicCatalogShell({
  children,
  className,
}: PublicCatalogShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FFF9ED] to-[#FAF7F2]">
      <GlobalNavigation />
      <main
        className={cn(
          "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
