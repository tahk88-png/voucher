"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const T = {
  en: {
    title: "Reset your password",
    subtitle: "Enter your new password below",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    submit: "Set new password",
    submitting: "Resetting\u2026",
    success: "Password reset!",
    successDesc: "Your password has been updated. You can now sign in.",
    goToLogin: "Go to sign in",
    errorMismatch: "Passwords do not match",
    errorShort: "Password must be at least 8 characters",
    errorExpired: "This reset link is invalid or has expired.",
    requestNew: "Request a new link",
    forgotTitle: "Forgot your password?",
    forgotSubtitle: "Enter your email and we\u2019ll send you a reset link",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    sendLink: "Send reset link",
    sending: "Sending\u2026",
    linkSent: "Check your email!",
    linkSentDesc: "If an account exists with that email, we\u2019ve sent a reset link.",
    backToLogin: "Back to sign in",
  },
  et: {
    title: "L\u00e4htesta parool",
    subtitle: "Sisesta uus parool allpool",
    newPassword: "Uus parool",
    confirmPassword: "Kinnita parool",
    submit: "M\u00e4\u00e4ra uus parool",
    submitting: "L\u00e4htestamine\u2026",
    success: "Parool l\u00e4htestatud!",
    successDesc: "Sinu parool on uuendatud. N\u00fc\u00fcd saad sisse logida.",
    goToLogin: "Mine sisselogimisse",
    errorMismatch: "Paroolid ei kattu",
    errorShort: "Parool peab olema v\u00e4hemalt 8 t\u00e4hem\u00e4rki",
    errorExpired: "See l\u00e4htestuslink on kehtetu v\u00f5i aegunud.",
    requestNew: "Taotle uut linki",
    forgotTitle: "Unustasid parooli?",
    forgotSubtitle: "Sisesta email ja saadame l\u00e4htestuslingi",
    emailLabel: "E-posti aadress",
    emailPlaceholder: "sina@n\u00e4ide.ee",
    sendLink: "Saada l\u00e4htestuslink",
    sending: "Saatmine\u2026",
    linkSent: "Vaata emaili!",
    linkSentDesc: "Kui selle emailiga konto on olemas, saatsime l\u00e4htestuslingi.",
    backToLogin: "Tagasi sisselogimisse",
  },
  ru: {
    title: "\u0421\u0431\u0440\u043e\u0441 \u043f\u0430\u0440\u043e\u043b\u044f",
    subtitle: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c \u043d\u0438\u0436\u0435",
    newPassword: "\u041d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c",
    confirmPassword: "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c",
    submit: "\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u043d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c",
    submitting: "\u0421\u0431\u0440\u043e\u0441\u2026",
    success: "\u041f\u0430\u0440\u043e\u043b\u044c \u0441\u0431\u0440\u043e\u0448\u0435\u043d!",
    successDesc: "\u0412\u0430\u0448 \u043f\u0430\u0440\u043e\u043b\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d. \u0422\u0435\u043f\u0435\u0440\u044c \u0432\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0432\u043e\u0439\u0442\u0438.",
    goToLogin: "\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043a \u0432\u0445\u043e\u0434\u0443",
    errorMismatch: "\u041f\u0430\u0440\u043e\u043b\u0438 \u043d\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u044e\u0442",
    errorShort: "\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043d\u0435 \u043c\u0435\u043d\u0435\u0435 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
    errorExpired: "\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u0430 \u0438\u043b\u0438 \u0438\u0441\u0442\u0435\u043a\u043b\u0430.",
    requestNew: "\u0417\u0430\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u0441\u0441\u044b\u043b\u043a\u0443",
    forgotTitle: "\u0417\u0430\u0431\u044b\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c?",
    forgotSubtitle: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email \u0438 \u043c\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u043c \u0441\u0441\u044b\u043b\u043a\u0443 \u0434\u043b\u044f \u0441\u0431\u0440\u043e\u0441\u0430",
    emailLabel: "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u043f\u043e\u0447\u0442\u0430",
    emailPlaceholder: "you@example.com",
    sendLink: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443",
    sending: "\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430\u2026",
    linkSent: "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e\u0447\u0442\u0443!",
    linkSentDesc: "\u0415\u0441\u043b\u0438 \u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442, \u043c\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u043b\u0438 \u0441\u0441\u044b\u043b\u043a\u0443.",
    backToLogin: "\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u0432\u0445\u043e\u0434\u0443",
  },
} as const;

type Lang = keyof typeof T;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [lang, setLang] = useState<Lang>("en");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Forgot password mode (no token in URL)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const t = T[lang];

  // If no token, show "forgot password" form
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md">
          {/* Language switcher */}
          <div className="flex justify-end mb-4 gap-2">
            {(["en", "et", "ru"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${lang === l ? "bg-[var(--primary)] text-[var(--text)] font-semibold" : "text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}>
                {l === "en" ? "EN" : l === "et" ? "ET" : "RU"}
              </button>
            ))}
          </div>

          <div className="glass rounded-[var(--r-lg)] p-8 shadow-lg">
            {forgotSent ? (
              <div className="text-center animate-slide-up">
                <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2">{t.linkSent}</h2>
                <p className="text-[var(--text-muted)] mb-6">{t.linkSentDesc}</p>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline">
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToLogin}
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{t.forgotTitle}</h1>
                <p className="text-[var(--text-muted)] text-sm mb-6">{t.forgotSubtitle}</p>

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
                    <Label htmlFor="email" className="text-sm font-medium text-[var(--text)]">{t.emailLabel}</Label>
                    <Input id="email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={t.emailPlaceholder} className="mt-1" autoFocus />
                  </div>
                  <button type="submit" disabled={forgotLoading || !forgotEmail}
                    className="w-full py-3 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
                    {forgotLoading ? t.sending : t.sendLink}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    {t.backToLogin}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Reset password form (token is in URL)
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t.errorShort);
      return;
    }
    if (password !== confirmPw) {
      setError(t.errorMismatch);
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
        setError(data.error || t.errorExpired);
        return;
      }
      setDone(true);
    } catch {
      setError(t.errorExpired);
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
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">{t.success}</h2>
          <p className="text-[var(--text-muted)] mb-6">{t.successDesc}</p>
          <Link href="/login"
            className="inline-block py-3 px-6 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 transition-all btn-press">
            {t.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4 gap-2">
          {(["en", "et", "ru"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${lang === l ? "bg-[var(--primary)] text-[var(--text)] font-semibold" : "text-[var(--text-muted)] hover:bg-[var(--surface)]"}`}>
              {l === "en" ? "EN" : l === "et" ? "ET" : "RU"}
            </button>
          ))}
        </div>

        <div className="glass rounded-[var(--r-lg)] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">{t.title}</h1>
              <p className="text-sm text-[var(--text-muted)]">{t.subtitle}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-start gap-2 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleReset}>
            <div className="mb-4">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--text)]">{t.newPassword}</Label>
              <Input id="password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} className="mt-1" autoFocus />
            </div>
            <div className="mb-6">
              <Label htmlFor="confirm" className="text-sm font-medium text-[var(--text)]">{t.confirmPassword}</Label>
              <Input id="confirm" type="password" required minLength={8} value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} className="mt-1" />
            </div>
            <button type="submit" disabled={loading || !password || !confirmPw}
              className="w-full py-3 rounded-[var(--r-sm)] font-semibold text-[var(--text)] bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 transition-all btn-press">
              {loading ? t.submitting : t.submit}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              {t.backToLogin}
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
