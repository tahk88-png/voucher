"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiErrorText } from "@/components/settings/api-error-text"

interface EditProfileFormProps {
  initialName: string
  email: string
}

export default function EditProfileForm({ initialName, email }: EditProfileFormProps) {
  const t = useTranslations("accountSecurity")
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!name.trim()) {
      setError(t("profileForm.nameRequired"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(apiErrorText(t, data.error, t("profileForm.updateFailed")))
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError(t("common.somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2.5 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-2.5 rounded-[var(--r-sm)] bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {t("profileForm.updated")}
        </div>
      )}

      <div>
        <Label htmlFor="profile-name" className="text-sm text-[var(--text)]">{t("profileForm.nameLabel")}</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          placeholder={t("profileForm.namePlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="profile-email" className="text-sm text-[var(--text)]">{t("profileForm.emailLabel")}</Label>
        <Input id="profile-email" value={email} disabled className="mt-1 opacity-60" />
        <p className="text-xs text-[var(--text-muted)] mt-1">{t("profileForm.emailLocked")}</p>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim() || name.trim() === initialName}
        className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press"
      >
        {loading ? t("common.saving") : t("profileForm.save")}
      </button>
    </form>
  )
}
