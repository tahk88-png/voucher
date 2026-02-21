"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import {
  Gift, ArrowLeft, AlertCircle, Mail, Lock, ChevronRight,
  CheckCircle, Sparkles, Shield, Zap
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

/* ─── Inline i18n for 3 required languages ─── */
const T = {
  en: {
    welcome: "Welcome back",
    subtitle: "Sign in to your GiftHub account",
    tabMagic: "Magic Link",
    tabPassword: "Password",
    tabSocial: "Social",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    sendCode: "Send sign-in code",
    sending: "Sending…",
    signIn: "Sign in",
    signingIn: "Signing in…",
    otpTitle: "Check your email!",
    otpDesc: "We sent a 6-digit code to",
    otpLabel: "Enter code",
    otpPlaceholder: "000000",
    verify: "Verify code",
    verifying: "Verifying…",
    resend: "Resend code",
    backToEmail: "Back",
    orContinueWith: "Or continue with",
    continueWith: "Continue with",
    errorWrongCode: "Invalid or expired code. Please try again.",
    errorWrongPass: "Invalid email or password.",
    errorGeneric: "Something went wrong. Please try again.",
    backToHome: "Back to homepage",
    socialDesc: "Sign in instantly with your preferred account",
    noAccount: "No account yet?",
    noAccountSub: "An account will be created automatically on first sign-in.",
    magicDesc: "We&rsquo;ll send a 6-digit code to your email. No password needed.",
    passwordDesc: "Sign in with your email and password.",
    langLabel: "Language",
    demo: "Demo accounts",
  },
  et: {
    welcome: "Tere tulemast tagasi",
    subtitle: "Logi sisse oma GiftHub kontoga",
    tabMagic: "Maagiline link",
    tabPassword: "Parool",
    tabSocial: "Sotsiaal",
    emailLabel: "E-posti aadress",
    emailPlaceholder: "sina@näide.ee",
    passwordLabel: "Parool",
    passwordPlaceholder: "••••••••",
    sendCode: "Saada sisselogimiskood",
    sending: "Saadan…",
    signIn: "Logi sisse",
    signingIn: "Loginud sisse…",
    otpTitle: "Kontrolli oma e-posti!",
    otpDesc: "Saatsime 6-kohalise koodi aadressile",
    otpLabel: "Sisesta kood",
    otpPlaceholder: "000000",
    verify: "Kinnita kood",
    verifying: "Kontrollin…",
    resend: "Saada kood uuesti",
    backToEmail: "Tagasi",
    orContinueWith: "Või jätka järgmisega",
    continueWith: "Jätka järgmisega",
    errorWrongCode: "Vale või aegunud kood. Palun proovi uuesti.",
    errorWrongPass: "Vale e-post või parool.",
    errorGeneric: "Midagi läks valesti. Palun proovi uuesti.",
    backToHome: "Tagasi avalehele",
    socialDesc: "Logi sisse oma eelistatud kontoga",
    noAccount: "Pole kontot?",
    noAccountSub: "Konto luuakse automaatselt esimesel sisselogimisel.",
    magicDesc: "Saadame 6-kohalise koodi sinu e-postile. Parooli pole vaja.",
    passwordDesc: "Logi sisse e-posti ja parooliga.",
    langLabel: "Keel",
    demo: "Demo kontod",
  },
  ru: {
    welcome: "С возвращением",
    subtitle: "Войдите в свой аккаунт GiftHub",
    tabMagic: "Магический код",
    tabPassword: "Пароль",
    tabSocial: "Соцсети",
    emailLabel: "Email адрес",
    emailPlaceholder: "вы@example.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "••••••••",
    sendCode: "Отправить код для входа",
    sending: "Отправляем…",
    signIn: "Войти",
    signingIn: "Входим…",
    otpTitle: "Проверьте почту!",
    otpDesc: "Мы отправили 6-значный код на",
    otpLabel: "Введите код",
    otpPlaceholder: "000000",
    verify: "Подтвердить",
    verifying: "Проверяем…",
    resend: "Отправить повторно",
    backToEmail: "Назад",
    orContinueWith: "Или продолжить через",
    continueWith: "Войти через",
    errorWrongCode: "Неверный или просроченный код. Попробуйте снова.",
    errorWrongPass: "Неверный email или пароль.",
    errorGeneric: "Что-то пошло не так. Попробуйте снова.",
    backToHome: "На главную",
    socialDesc: "Войдите через удобный аккаунт",
    noAccount: "Нет аккаунта?",
    noAccountSub: "Аккаунт создастся автоматически при первом входе.",
    magicDesc: "Отправим 6-значный код на ваш email. Пароль не нужен.",
    passwordDesc: "Войдите с помощью email и пароля.",
    langLabel: "Язык",
    demo: "Demo аккаунты",
  },
} as const

type Lang = keyof typeof T

const DEMO_CREDENTIALS = [
  { role: "Platform Admin", email: "platform-admin@gifthub.local", password: "platform123" },
  { role: "Merchant Admin", email: "admin@coffee-house.com", password: "admin123" },
  { role: "Merchant Staff", email: "staff@coffee-house.com", password: "staff123" },
  { role: "End User", email: "test@example.com", password: "test123" },
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

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
]

type Tab = "magic" | "password" | "social"

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = LANG_OPTIONS.find(l => l.code === lang)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] bg-white/60 hover:bg-white hover:border-[var(--primary)] transition-all backdrop-blur-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-[var(--r-sm)] border border-[var(--border)] bg-white shadow-lg overflow-hidden z-50 animate-scale-in">
          {LANG_OPTIONS.map(opt => (
            <button
              key={opt.code}
              onClick={() => { setLang(opt.code); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-[var(--surface-muted)] transition-colors ${lang === opt.code ? "font-semibold text-[var(--text)] bg-[var(--accent)]" : "text-[var(--text-muted)]"}`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OAuthButton({ providerId, label, onClick }: { providerId: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-white hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-200 font-medium text-[var(--text)] btn-press group"
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

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app/entry"

  const [lang, setLang] = useState<Lang>("en")
  const [tab, setTab] = useState<Tab>("magic")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthProviders, setOauthProviders] = useState<string[]>([])

  const s = T[lang]

  useEffect(() => {
    getProviders().then((providers) => {
      if (!providers) return
      const oauth = Object.keys(providers).filter(id => id !== "credentials")
      setOauthProviders(oauth)
      if (oauth.length > 0) setTab("social")
      else setTab("magic")
    })
  }, [])

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
      if (!res.ok) throw new Error()
      setOtpEmail(email.trim().toLowerCase())
      setOtpSent(true)
    } catch {
      setError(s.errorGeneric)
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
        setError(s.errorWrongCode)
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
        setError(s.errorWrongCode)
        setIsLoading(false)
      }
    } catch {
      setError(s.errorGeneric)
      setIsLoading(false)
    }
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const res = await signIn("credentials", { email, password, callbackUrl, redirect: false })
    setIsLoading(false)
    if (res?.error) {
      setError(s.errorWrongPass)
      return
    }
    if (res?.ok) window.location.href = res.url ?? callbackUrl
  }

  const tabClass = (active: boolean) =>
    `relative flex-1 py-2.5 text-sm font-semibold rounded-[10px] transition-all duration-200 ${
      active
        ? "bg-white text-[var(--text)] shadow-sm"
        : "text-[var(--text-muted)] hover:text-[var(--text)]"
    }`

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7E0] via-[#FFFBF5] to-[#F0E8FF]" />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--primary)] opacity-[0.12] blur-[80px] animate-orb" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-purple-400 opacity-[0.07] blur-[100px] animate-orb-2" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-[var(--success)] opacity-[0.06] blur-[60px] animate-orb-3" />

      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LangSwitcher lang={lang} setLang={setLang} />
      </div>

      {/* Back to home — top left */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-full hover:bg-white/60 backdrop-blur-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{s.backToHome}</span>
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
          <h1 className="text-xl font-bold text-[var(--text)]">{s.welcome}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.subtitle}</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-[var(--r-xl)] shadow-xl overflow-hidden">
          {/* Tab bar */}
          <div className="p-1.5 bg-[var(--surface-muted)] mx-4 mt-4 rounded-[14px] flex gap-1">
            {(["magic", "password", "social"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setOtpSent(false) }}
                className={tabClass(tab === t)}
              >
                {t === "magic" && s.tabMagic}
                {t === "password" && s.tabPassword}
                {t === "social" && s.tabSocial}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            {error && <div className="mb-4"><ErrorBanner msg={error} /></div>}

            {/* ── MAGIC LINK TAB ── */}
            {tab === "magic" && (
              <div className="tab-content-enter">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3"
                       dangerouslySetInnerHTML={{ __html: s.magicDesc.replace("&rsquo;", "\u2019") }} />
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[var(--text)]">{s.emailLabel}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        <Input
                          type="email"
                          placeholder={s.emailPlaceholder}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--text)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                          {s.sending}
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {s.sendCode}
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
                      <p className="font-semibold text-[var(--text)]">{s.otpTitle}</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {s.otpDesc} <span className="font-medium text-[var(--text)]">{otpEmail}</span>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[var(--text)]">{s.otpLabel}</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder={s.otpPlaceholder}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--text)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                          {s.verifying}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {s.verify}
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
                        {s.backToEmail}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtp(""); setError(null); handleSendOtp({ preventDefault: () => {} } as React.FormEvent) }}
                        className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
                      >
                        {s.resend}
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
                  <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">{s.passwordDesc}</p>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[var(--text)]">{s.emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        type="email"
                        placeholder={s.emailPlaceholder}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[var(--text)]">{s.passwordLabel}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        type="password"
                        placeholder={s.passwordPlaceholder}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--text)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        {s.signingIn}
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        {s.signIn}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── SOCIAL TAB ── */}
            {tab === "social" && (
              <div className="tab-content-enter space-y-3">
                <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">{s.socialDesc}</p>
                {oauthProviders.length > 0 ? (
                  oauthProviders.map(providerId => (
                    <OAuthButton
                      key={providerId}
                      providerId={providerId}
                      label={`${s.continueWith} ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}`}
                      onClick={() => signIn(providerId, { callbackUrl })}
                    />
                  ))
                ) : (
                  /* Show all 3 social buttons even when not configured — visually useful */
                  ["google", "apple", "facebook"].map(providerId => (
                    <OAuthButton
                      key={providerId}
                      providerId={providerId}
                      label={`${s.continueWith} ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}`}
                      onClick={() => signIn(providerId, { callbackUrl })}
                    />
                  ))
                )}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-[var(--text-muted)]">{s.orContinueWith}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("magic")}
                  className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-[var(--r-sm)] border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <Mail className="w-4 h-4" />
                  {s.tabMagic}
                </button>
              </div>
            )}

            {/* Social sign-in note */}
            {tab !== "social" && (
              <p className="text-xs text-[var(--text-muted)] text-center mt-4">{s.noAccountSub}</p>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 py-3 px-6 border-t border-[var(--border)] bg-[var(--surface-muted)]">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Shield className="w-3 h-3" />
              <span>SSL</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Sparkles className="w-3 h-3" />
              <span>GiftHub</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Zap className="w-3 h-3" />
              <span>Fast</span>
            </div>
          </div>
        </div>

        {/* Demo credentials (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-[var(--r-sm)] border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold mb-1.5 flex items-center gap-1.5">
              <span>🔑</span>
              {s.demo}
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
                  {c.role}: <span className="font-mono">{c.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7E0] via-[#FFFBF5] to-[#F0E8FF]">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-soft shadow-lg">
          <Gift className="h-6 w-6 text-white" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
