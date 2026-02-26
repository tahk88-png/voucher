"use client"

import { useState } from "react"
import { AlertCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)

  const confirmed = confirmation === "DELETE"

  async function handleDelete() {
    if (!confirmed) return
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to delete account")
        setLoading(false)
        return
      }

      // Redirect to home after deletion
      window.location.href = "/"
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); setError("") }}>
      <AlertDialogTrigger asChild>
        <button className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
          <span className="inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete account
          </span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is permanent. Your profile, sessions, and notification settings will be deleted. Purchase history will be anonymized.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {error && (
            <div className="p-2.5 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)]">
            Type <span className="font-bold text-[var(--text)]">DELETE</span> to confirm:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="inline-flex items-center justify-center rounded-[var(--r-sm)] px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting\u2026" : "Delete permanently"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
