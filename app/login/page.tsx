"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Mail, ArrowLeft, AlertCircle } from "lucide-react"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const TEST_EMAIL = "test@example.com"
const TEST_PASSWORD = "test123"

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrlParam = searchParams.get("callbackUrl")
  const callbackUrl = callbackUrlParam ?? "/app/entry"

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const res = await signIn("credentials", { email, password, callbackUrl, redirect: false })
    setIsLoading(false)
    if (res?.error) {
      setError("Invalid email or password.")
      return
    }
    if (res?.ok) {
      window.location.href = res.url ?? callbackUrl
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    await signIn("email", { email, callbackUrl })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Mail className="h-7 w-7 text-[#2D2721]" />
            </div>
            <span className="text-2xl font-bold text-[#2D2721]">GiftHub</span>
          </div>
        </div>

        <WarmCard padding="lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#2D2721] mb-2">Welcome back</h1>
            <p className="text-[#6B5744]">Sign in and we will route you to the correct workspace automatically.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] rounded-[12px] px-3 py-2 mb-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-medium text-[#2D2721]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => signIn("apple", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-medium text-[#2D2721]"
            >
              <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(139,115,85,0.2)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#8B7355]">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cred-email" className="text-[#2D2721] font-medium">
                Email address
              </Label>
              <Input
                id="cred-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white focus:border-[#FFC857] focus:ring-[#FFC857] h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-password" className="text-[#2D2721] font-medium">
                Password
              </Label>
              <Input
                id="cred-password"
                name="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white focus:border-[#FFC857] focus:ring-[#FFC857] h-12"
                required
              />
            </div>
            <WarmButton type="submit" size="lg" fullWidth isLoading={isLoading}>
              Sign in
            </WarmButton>
          </form>

          <form onSubmit={handleEmailSignIn} className="space-y-4 mt-6">
            <Label htmlFor="magic-email" className="text-[#2D2721] font-medium">
              Magic link email
            </Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white focus:border-[#FFC857] focus:ring-[#FFC857] h-12"
              required
            />
            <WarmButton type="submit" variant="outline" fullWidth isLoading={isLoading}>
              Send magic link
            </WarmButton>
          </form>

          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 mt-6">
              <span className="font-medium">Test user:</span> {TEST_EMAIL} / {TEST_PASSWORD}
            </div>
          )}
        </WarmCard>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mx-auto mt-6 transition-colors w-fit"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </span>
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
