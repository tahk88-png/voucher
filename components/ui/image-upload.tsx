"use client"

import * as React from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"

interface ImageUploadProps {
  value?: string | File
  onChange?: (file: File | null) => void
  maxSize?: number // in MB
  aspectRatio?: "square" | "video" | "auto"
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  maxSize = 5,
  aspectRatio = "auto",
  className,
  disabled,
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (typeof value === "string") {
      setPreview(value)
    } else if (value instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(value)
    } else {
      setPreview("")
    }
  }, [value])

  const validateImage = (file: File): boolean => {
    setError("")

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return false
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSize}MB`)
      return false
    }

    return true
  }

  const handleFile = (file: File | null) => {
    if (!file) return

    if (validateImage(file)) {
      onChange?.(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null)
  }

  const handleRemove = () => {
    setPreview("")
    onChange?.(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto",
  }[aspectRatio]

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]/50 overflow-hidden transition-colors",
          dragActive && "border-[var(--primary)] bg-[var(--bg-2)]",
          disabled && "opacity-50 cursor-not-allowed",
          aspectRatioClass
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />

        {preview ? (
          <div className="relative w-full h-full min-h-[200px]">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 rounded-full bg-[var(--text)]/80 p-2 text-white hover:bg-[var(--text)] transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-2)]">
              <ImageIcon className="h-6 w-6 text-[var(--text-faint)]" />
            </div>
            <div className="mb-2 text-sm font-medium text-[var(--text)]">
              {dragActive ? "Drop image here" : "Upload image"}
            </div>
            <div className="mb-4 text-xs text-[var(--text-muted)]">
              PNG, JPG, GIF up to {maxSize}MB
            </div>
            <WarmButton
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Select image
            </WarmButton>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-[12px] border-2 border-[var(--danger)] bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
    </div>
  )
}
