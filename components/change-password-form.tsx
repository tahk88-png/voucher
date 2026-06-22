"use client"

import { useState } from "react"
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (newPw.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (newPw !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? current : undefined,
          newPassword: newPw,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to change password")
        return
      }

      setSuccess(true)
      setCurrent("")
      setNewPw("")
      setConfirm("")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-2.5 rounded-[var(--r-sm)] bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Password updated successfully
        </div>
      )}

      {hasPassword && (
        <div>
          <Label htmlFor="current-pw" className="text-sm text-[var(--text)]">Current password</Label>
          <Input id="current-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1" />
        </div>
      )}

      <div>
        <Label htmlFor="new-pw" className="text-sm text-[var(--text)]">{hasPassword ? "New password" : "Set password"}</Label>
        <div className="relative mt-1">
          <Input id="new-pw" type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
          <button type="button" onClick={() => setShowNew(!showNew)}
            aria-label={showNew ? "Hide password" : "Show password"}
            aria-pressed={showNew}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirm-pw" className="text-sm text-[var(--text)]">Confirm password</Label>
        <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
      </div>

      <button type="submit" disabled={loading || !newPw || !confirm || (hasPassword && !current)}
        className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
        {loading ? "Saving\u2026" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  )
}
