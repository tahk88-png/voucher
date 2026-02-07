import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"
import { WarmButton } from "@/components/warm-button"

interface PageErrorProps {
  statusCode?: number
  title?: string
  message?: string
  showHomeButton?: boolean
}

export function PageError({
  statusCode = 500,
  title,
  message,
  showHomeButton = true,
}: PageErrorProps) {
  const defaultTitles: Record<number, string> = {
    404: "Page not found",
    500: "Internal server error",
    403: "Forbidden",
    401: "Unauthorized",
  }

  const defaultMessages: Record<number, string> = {
    404: "The page you're looking for doesn't exist or has been moved.",
    500: "Something went wrong on our end. We're working to fix it.",
    403: "You don't have permission to access this page.",
    401: "Please sign in to access this page.",
  }

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-xl bg-[#E17B5C]/10">
          <AlertCircle className="h-10 w-10 text-[#E17B5C]" />
        </div>
        <div className="mb-2 text-6xl font-bold text-[#2D2721]">
          {statusCode}
        </div>
        <h1 className="mb-4 text-2xl font-bold text-[#2D2721]">
          {title || defaultTitles[statusCode] || "An error occurred"}
        </h1>
        <p className="mb-8 max-w-md text-[#6B5744]">
          {message || defaultMessages[statusCode] || "Please try again later."}
        </p>
        {showHomeButton && (
          <WarmButton asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </WarmButton>
        )}
      </div>
    </div>
  )
}
