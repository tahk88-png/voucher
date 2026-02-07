"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WarmButton } from "@/components/warm-button"
import { AlertTriangle, Info, CheckCircle } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: "default" | "destructive" | "warning"
  isLoading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Confirmation action failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const icons = {
    default: <Info className="h-6 w-6 text-[#FFC857]" />,
    destructive: <AlertTriangle className="h-6 w-6 text-[#E17B5C]" />,
    warning: <AlertTriangle className="h-6 w-6 text-[#FFC857]" />,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF7F2]">
            {icons[variant]}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end gap-2">
          <WarmButton
            type="button"
            variant="outline"
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
            disabled={isProcessing || isLoading}
          >
            {cancelLabel}
          </WarmButton>
          <WarmButton
            type="button"
            variant={variant === "destructive" ? "outline" : "primary"}
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
            isLoading={isProcessing || isLoading}
          >
            {confirmLabel}
          </WarmButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easy use
export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description: string
    onConfirm?: () => void | Promise<void>
    variant?: "default" | "destructive" | "warning"
    confirmLabel?: string
    cancelLabel?: string
  }>({
    open: false,
    title: "",
    description: "",
  })
  const resolverRef = React.useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = (options: Omit<typeof state, "open">) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setState({
        ...options,
        open: true,
      })
    })
  }
  const handleConfirm = async () => {
    try {
      await state.onConfirm?.()
    } finally {
      resolverRef.current?.(true)
      resolverRef.current = null
    }
  }

  const handleCancel = () => {
    resolverRef.current?.(false)
    resolverRef.current = null
  }

  const dialog = (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel()
        }
        setState((s) => ({ ...s, open }))
      }}
      title={state.title}
      description={state.description}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      variant={state.variant}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
    />
  )

  return { confirm, dialog }
}
