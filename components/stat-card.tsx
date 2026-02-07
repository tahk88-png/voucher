import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#6B5744]">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-[#8B7355]" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#2D2721]">{value}</div>
        {description && (
          <p className="text-xs text-[#6B5744] mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
