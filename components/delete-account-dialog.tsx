"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
import { apiErrorText } from "@/components/settings/api-error-text"

/** The word the user types to confirm; the same in every language. */
const CONFIRM_WORD = "DELETE"

export default function DeleteAccountDialog() {
  const t = useTranslations("accountSecurity")
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)

  const confirmed = confirmation === CONFIRM_WORD

  async function handleDelete() {
    if (!confirmed) return
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setError(apiErrorText(t, data.error, t("deleteDialog.failed")))
        setLoading(false)
        return
      }

      // Redirect to home after deletion
      window.location.href = "/"
    } catch {
      setError(t("common.somethingWentWrong"))
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); setError("") }}>
      <AlertDialogTrigger asChild>
        <button className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
          <span className="inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {t("deleteDialog.trigger")}
          </span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDialog.description")}
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
            {t.rich("deleteDialog.typeToConfirm", {
              word: CONFIRM_WORD,
              strong: (chunks) => <span className="font-bold text-[var(--text)]">{chunks}</span>,
            })}
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="inline-flex items-center justify-center rounded-[var(--r-sm)] px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
