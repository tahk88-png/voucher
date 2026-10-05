"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Gift, ArrowLeft, AlertCircle, Mail, Lock, ChevronRight,
  CheckCircle, Zap, Fingerprint
} from "lucide-react"
import { usePasskey } from "@/hooks/use-passkey"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { authErrorKey } from "./auth-error"
import { LanguageSelector } from "@/components/navigation/language-selector"

/** Keys under authPages.login that the error banner can show. */
type LoginErrorKey =
  | "errorWrongCode"
  | "errorWrongPass"
  | "errorGeneric"
  | "errorEmailUnavailable"
  | "errorCredentialsSignin"
  | "errorAuthGeneric"

/**
 * An error is kept as a message key (translated at render, so it follows a
 * language switch) or as text that came from the server / passkey hook.
 */
type LoginError = { key: LoginErrorKey } | { raw: string }

const DEMO_CREDENTIALS = [
  { role: "platformAdmin", email: "platform-admin@gifthub.local", password: "platform123" },
  { role: "merchantAdmin", email: "admin@coffee-house.com", password: "admin123" },
  { role: "merchantStaff", email: "staff@coffee-house.com", password: "staff123" },
  { role: "endUser", email: "test@example.com", password: "test123" },
] as const

const OAUTH_ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  apple: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5 shrink-0" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
}

type Tab = "magic" | "password" | "social" | "passkey"

function OAuthButton({ providerId, label, onClick }: { providerId: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-200 font-medium text-[var(--text)] btn-press group"
    >
      {OAUTH_ICONS[providerId]}
      <span className="text-sm">{label}</span>
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-red-50 border border-red-200 rounded-[var(--r-sm)] px-3 py-2.5 animate-slide-down">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  )
}

function titleCaseProvider(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1)
}

export function LoginForm({ emailSignInEnabled }: { emailSignInEnabled: boolean }) {
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") ?? "/app/entry"
  // Validate callback URL is relative to prevent open redirect
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/app/entry"

  const [tab, setTab] = useState<Tab>(emailSignInEnabled ? "magic" : "password")
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [oauthProviders, setOauthProviders] = useState<{ id: string; name: string }[]>([])
  const justRegistered = searchParams.get("registered") === "1"
  const initialErrorKey = authErrorKey(searchParams.get("error"))
  const [error, setError] = useState<LoginError | null>(initialErrorKey ? { key: initialErrorKey } : null)

  const s = useTranslations("authPages.login")
  const { startAuthentication, isLoading: passkeyLoading, error: passkeyError } = usePasskey()

  useEffect(() => {
    let cancelled = false
    getProviders()
      .then((providers) => {
        if (cancelled || !providers) return
        const oauth = Object.values(providers)
          .filter(p => p.type === "oauth" || p.type === "oidc")
          .map(p => ({ id: p.id, name: p.name }))
        setOauthProviders(oauth)
        // Coming back from registration: stay on the password tab with the email prefilled.
        if (oauth.length > 0 && !justRegistered && !initialErrorKey) setTab("social")
      })
      .catch(() => {
        // Provider list unavailable: the social tab stays hidden; other tabs still work.
        setOauthProviders([])
      })
    return () => { cancelled = true }
  }, [justRegistered, initialErrorKey])

  const visibleTabs: Tab[] = [
    ...(emailSignInEnabled ? (["magic"] as Tab[]) : []),
    "password",
    ...(oauthProviders.length > 0 ? (["social"] as Tab[]) : []),
    "passkey",
  ]

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (res.status === 503) {
        setError({ key: "errorEmailUnavailable" })
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(typeof data?.error === "string" ? { raw: data.error } : { key: "errorGeneric" })
        return
      }
      setOtpEmail(email.trim().toLowerCase())
      setOtpSent(true)
    } catch {
      setError({ key: "errorGeneric" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.verified) {
        setError({ key: "errorWrongCode" })
        setIsLoading(false)
        return
      }
      const signInRes = await signIn("credentials", {
        email: otpEmail,
        magicToken: data.magicToken,
        callbackUrl,
        redirect: false,
      })
      if (signInRes?.ok) {
        window.location.href = signInRes.url ?? callbackUrl
      } else {
        setError({ key: "errorWrongCode" })
        setIsLoading(false)
      }
    } catch {
      setError({ key: "errorGeneric" })
      setIsLoading(false)
    }
  }

  const handlePasskeySignIn = async () => {
    setError(null)
    const result = await startAuthentication()
    if (!result) {
      if (passkeyError) setError({ raw: passkeyError })
      return
    }
    const signInRes = await signIn("credentials", {
      email: result.email,
      magicToken: result.magicToken,
      callbackUrl,
      redirect: false,
    })
    if (signInRes?.ok) {
      window.location.href = signInRes.url ?? callbackUrl
    } else {
      setError({ key: "errorGeneric" })
    }
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const res = await signIn("credentials", { email, password, callbackUrl, redirect: false })
    setIsLoading(false)
    if (res?.error) {
      setError({ key: "errorWrongPass" })
      return
    }
    if (res?.ok) window.location.href = res.url ?? callbackUrl
  }

  const tabClass = (active: boolean) =>
    `relative flex-1 py-2.5 text-sm font-semibold rounded-[10px] transition-all duration-200 ${
      active
        ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
        : "text-[var(--text-muted)] hover:text-[var(--text)]"
    }`

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[var(--surface)] to-[var(--bg-2)]" />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--primary)] opacity-[0.12] blur-[80px] animate-orb" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-[var(--secondary)] opacity-[0.08] blur-[100px] animate-orb-2" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-[var(--success)] opacity-[0.06] blur-[60px] animate-orb-3" />

      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="compact" />
      </div>

      {/* Back to home — top left */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-full hover:bg-white/60 backdrop-blur-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{s("backToHome")}</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-lg glow-primary">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[var(--text)] tracking-tight">GiftHub</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">{s("welcome")}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{s("subtitle")}</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-[var(--r-xl)] shadow-xl overflow-hidden">
          {/* Tab bar */}
          <div className="p-1.5 bg-[var(--surface-muted)] mx-4 mt-4 rounded-[14px] flex gap-1">
            {visibleTabs.map(t => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => { setTab(t); setError(null); setOtpSent(false) }}
                className={tabClass(tab === t)}
              >
                {t === "magic" && s("tabMagic")}
                {t === "password" && s("tabPassword")}
                {t === "social" && s("tabSocial")}
                {t === "passkey" && <span className="flex items-center justify-center gap-1"><Fingerprint className="w-3.5 h-3.5" />{s("tabPasskey")}</span>}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            {justRegistered && !error && (
              <div role="status" className="mb-4 flex items-start gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-[var(--r-sm)] px-3 py-2.5">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{s("registered")}</span>
              </div>
            )}
            {error && <div className="mb-4" role="alert"><ErrorBanner msg={"key" in error ? s(error.key) : error.raw} /></div>}

            {/* ── MAGIC LINK TAB ── */}
            {tab === "magic" && emailSignInEnabled && (
              <div className="tab-content-enter">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">{s("magicDesc")}</p>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-magic-email" className="text-sm font-medium text-[var(--text)]">{s("emailLabel")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        <Input
                          id="login-magic-email"
                          type="email"
                          autoComplete="email"
                          placeholder={s("emailPlaceholder")}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-[var(--surface)]"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--primary-foreground)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                          {s("sending")}
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {s("sendCode")}
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-slide-up">
                    <div className="text-center py-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-3">
                        <Mail className="h-6 w-6 text-[var(--primary)]" />
                      </div>
                      <p className="font-semibold text-[var(--text)]">{s("otpTitle")}</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {s.rich("otpDesc", {
                          email: otpEmail,
                          b: (chunks) => <span className="font-medium text-[var(--text)]">{chunks}</span>,
                        })}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-otp" className="text-sm font-medium text-[var(--text)]">{s("otpLabel")}</Label>
                      <Input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-[var(--surface)]"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--primary-foreground)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                          {s("verifying")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {s("verify")}
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(""); setError(null) }}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {s("backToEmail")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtp(""); setError(null); handleSendOtp({ preventDefault: () => {} } as React.FormEvent) }}
                        className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
                      >
                        {s("resend")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── PASSWORD TAB ── */}
            {tab === "password" && (
              <div className="tab-content-enter">
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div className="flex items-center justify-between -mt-1 mb-3">
                    <p className="text-xs text-[var(--text-muted)]">{s("passwordDesc")}</p>
                    <Link href="/reset-password" className="text-xs font-medium text-[var(--primary)] hover:underline">{s("forgotPassword")}</Link>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password-email" className="text-sm font-medium text-[var(--text)]">{s("emailLabel")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="login-password-email"
                        type="email"
                        autoComplete="email"
                        placeholder={s("emailPlaceholder")}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-[var(--surface)]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-sm font-medium text-[var(--text)]">{s("passwordLabel")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-[var(--surface)]"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--primary-foreground)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        {s("signingIn")}
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        {s("signIn")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── SOCIAL TAB ── */}
            {tab === "social" && oauthProviders.length > 0 && (
              <div className="tab-content-enter space-y-3">
                <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">{s("socialDesc")}</p>
                {oauthProviders.map(provider => (
                  <OAuthButton
                    key={provider.id}
                    providerId={provider.id}
                    label={s("continueWith", { provider: provider.name || titleCaseProvider(provider.id) })}
                    onClick={() => signIn(provider.id, { callbackUrl })}
                  />
                ))}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[var(--surface)] text-[var(--text-muted)]">{s("orContinueWith")}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab(emailSignInEnabled ? "magic" : "password")}
                  className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-[var(--r-sm)] border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {emailSignInEnabled ? <Mail className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {emailSignInEnabled ? s("tabMagic") : s("tabPassword")}
                </button>
              </div>
            )}

            {/* ── PASSKEY TAB ── */}
            {tab === "passkey" && (
              <div className="tab-content-enter space-y-4">
                <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">{s("passkeyDesc")}</p>
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
                    <Fingerprint className="h-8 w-8 text-[var(--primary)]" />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={passkeyLoading}
                    className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--primary-foreground)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {passkeyLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        {s("passkeyAuthenticating")}
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        {s("passkeyButton")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Social sign-in note + register link */}
            {tab !== "social" && (
              <div className="text-center mt-4 space-y-1">
                {/* verify-otp creates the account on first code sign-in, so this is only true on the code tab */}
                {tab === "magic" && emailSignInEnabled && (
                  <p className="text-xs text-[var(--text-muted)]">{s("noAccountSub")}</p>
                )}
                <p className="text-sm text-[var(--text-muted)]">
                  {s("noAccount")}{" "}
                  <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">
                    {s("createAccount")}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Demo credentials (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-[var(--r-sm)] border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold mb-1.5 flex items-center gap-1.5">
              <span>🔑</span>
              {s("demo")}
            </p>
            <div className="space-y-0.5">
              {DEMO_CREDENTIALS.map(c => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => {
                    setTab("password")
                    setEmail(c.email)
                    setPassword(c.password)
                  }}
                  className="block w-full text-left text-xs hover:text-amber-950 hover:font-medium transition-colors py-0.5"
                >
                  {s(`demoRole.${c.role}`)}: <span className="font-mono">{c.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function LoginPageClient({ emailSignInEnabled }: { emailSignInEnabled: boolean }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg)] via-[var(--surface)] to-[var(--bg-2)]">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-soft shadow-lg">
          <Gift className="h-6 w-6 text-white" />
        </div>
      </div>
    }>
      <LoginForm emailSignInEnabled={emailSignInEnabled} />
    </Suspense>
  )
}
