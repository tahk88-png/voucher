"use client"

import * as React from "react"
import { Upload, X, File, Image as ImageIcon, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  value?: File[]
  className?: string
  disabled?: boolean
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10,
  maxFiles = 5,
  onFilesChange,
  value = [],
  className,
  disabled,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>(value)
  const [dragActive, setDragActive] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validateFiles = (newFiles: File[]): File[] => {
    setError("")

    // Check max files
    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return []
    }

    // Check file sizes
    const oversizedFiles = newFiles.filter(
      (file) => file.size > maxSize * 1024 * 1024
    )
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSize}MB`)
      return []
    }

    return newFiles
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const filesArray = Array.from(newFiles)
    const validFiles = validateFiles(filesArray)

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
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
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (file.type.includes("pdf")) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]/50 p-8 text-center transition-colors",
          dragActive && "border-[var(--primary)] bg-[var(--bg-2)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-2)]">
          <Upload className="h-6 w-6 text-[var(--text-faint)]" />
        </div>
        <div className="mb-2 text-sm font-medium text-[var(--text)]">
          {dragActive ? "Drop files here" : "Drag & drop files here"}
        </div>
        <div className="mb-4 text-xs text-[var(--text-muted)]">
          or click to browse (max {maxSize}MB per file)
        </div>
        <WarmButton
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Select files
        </WarmButton>
      </div>

      {error && (
        <div className="rounded-[12px] border-2 border-[var(--danger)] bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="text-[var(--text-faint)]">{getFileIcon(file)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text)] truncate">
                  {file.name}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
