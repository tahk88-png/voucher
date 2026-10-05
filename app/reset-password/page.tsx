"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { LanguageSelector } from "@/components/navigation/language-selector"
import PasswordStrengthMeter from "@/components/password-strength-meter"
import { checkPasswordStrength } from "@/lib/password-strength"

// Errors keep a message key (translated at render, so they follow a language
// switch) or the server's own text.
type ResetErrorKey = "errorShort" | "errorWeak" | "errorMismatch" | "errorExpired"
type ResetError = { key: ResetErrorKey } | { raw: string } | null

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ResetError>(null);
  const [done, setDone] = useState(false);

  // Forgot password mode (no token in URL)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const t = useTranslations("authPages.resetPassword");

  // If no token, show "forgot password" form
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md">
          {/* Language switcher */}
          <div className="flex justify-end mb-4 gap-2">
            <LanguageSelector variant="compact" />
          </div>

          <div className="glass rounded-[var(--r-lg)] p-8 shadow-lg">
            {forgotSent ? (
              <div className="text-center animate-slide-up">
                <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2">{t("linkSent")}</h2>
                <p className="text-[var(--text-muted)] mb-6">{t("linkSentDesc")}</p>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline">
                  <ArrowLeft className="w-4 h-4" />
                  {t("backToLogin")}
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{t("forgotTitle")}</h1>
                <p className="text-[var(--text-muted)] text-sm mb-6">{t("forgotSubtitle")}</p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotLoading(true);
                  try {
                    await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail }),
                    });
                    setForgotSent(true);
                  } catch {
                    setForgotSent(true); // Always show success to prevent enumeration
                  } finally {
                    setForgotLoading(false);
                  }
                }}>
                  <div className="mb-4">
                    <Label htmlFor="email" className="text-sm font-medium text-[var(--text)]">{t("emailLabel")}</Label>
                    <Input id="email" type="email" autoComplete="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={t("emailPlaceholder")} className="mt-1" autoFocus />
                  </div>
                  <button type="submit" disabled={forgotLoading || !forgotEmail}
                    className="w-full py-3 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
                    {forgotLoading ? t("sending") : t("sendLink")}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    {t("backToLogin")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const passwordResult = checkPasswordStrength(password);

  // Reset password form (token is in URL)
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError({ key: "errorShort" });
      return;
    }
    if (passwordResult.score < 2) {
      setError({ key: "errorWeak" });
      return;
    }
    if (password !== confirmPw) {
      setError({ key: "errorMismatch" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ? { raw: String(data.error) } : { key: "errorExpired" });
        return;
      }
      setDone(true);
    } catch {
      setError({ key: "errorExpired" });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md glass rounded-[var(--r-lg)] p-8 shadow-lg text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">{t("success")}</h2>
          <p className="text-[var(--text-muted)] mb-6">{t("successDesc")}</p>
          <Link href="/login"
            className="inline-block py-3 px-6 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 transition-all btn-press">
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4 gap-2">
          <LanguageSelector variant="compact" />
        </div>

        <div className="glass rounded-[var(--r-lg)] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">{t("title")}</h1>
              <p className="text-sm text-[var(--text-muted)]">{t("subtitle")}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-start gap-2 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{"key" in error ? t(error.key) : error.raw}</p>
            </div>
          )}

          <form onSubmit={handleReset}>
            <div className="mb-4">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--text)]">{t("newPassword")}</Label>
              <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} className="mt-1" autoFocus />
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="mb-6">
              <Label htmlFor="confirm" className="text-sm font-medium text-[var(--text)]">{t("confirmPassword")}</Label>
              <Input id="confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} className="mt-1" />
            </div>
            <button type="submit" disabled={loading || !password || !confirmPw}
              className="w-full py-3 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
