"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { WarmButton } from "@/components/warm-button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-[#E17B5C] bg-[#E17B5C]/10 p-8 text-center">
          <div className="mb-4 rounded-xl bg-[#E17B5C]/20 p-3">
            <AlertTriangle className="h-10 w-10 text-[#E17B5C]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#2D2721]">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-sm text-[#6B5744]">
            {this.state.error?.message ||
              "An unexpected error occurred. Please try again."}
          </p>
          <div className="flex gap-2">
            <WarmButton
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
            >
              Try again
            </WarmButton>
            <WarmButton onClick={() => window.location.reload()}>
              Reload page
            </WarmButton>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
