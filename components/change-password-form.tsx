"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiErrorText } from "@/components/settings/api-error-text"

const MIN_PASSWORD_LENGTH = 8

export default function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations("accountSecurity")
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

    if (newPw.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordForm.tooShort", { min: MIN_PASSWORD_LENGTH }))
      return
    }
    if (newPw !== confirm) {
      setError(t("passwordForm.mismatch"))
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
        setError(apiErrorText(t, data.error, t("passwordForm.changeFailed")))
        return
      }

      setSuccess(true)
      setCurrent("")
      setNewPw("")
      setConfirm("")
    } catch {
      setError(t("common.somethingWentWrong"))
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
          {t("passwordForm.updated")}
        </div>
      )}

      {hasPassword && (
        <div>
          <Label htmlFor="current-pw" className="text-sm text-[var(--text)]">{t("passwordForm.currentLabel")}</Label>
          <Input id="current-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1" />
        </div>
      )}

      <div>
        <Label htmlFor="new-pw" className="text-sm text-[var(--text)]">{hasPassword ? t("passwordForm.newLabel") : t("passwordForm.setLabel")}</Label>
        <div className="relative mt-1">
          <Input id="new-pw" type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
          <button type="button" onClick={() => setShowNew(!showNew)}
            aria-label={showNew ? t("passwordForm.hidePassword") : t("passwordForm.showPassword")}
            aria-pressed={showNew}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirm-pw" className="text-sm text-[var(--text)]">{t("passwordForm.confirmLabel")}</Label>
        <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
      </div>

      <button type="submit" disabled={loading || !newPw || !confirm || (hasPassword && !current)}
        className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
        {loading ? t("common.saving") : hasPassword ? t("passwordForm.change") : t("passwordForm.set")}
      </button>
    </form>
  )
}
