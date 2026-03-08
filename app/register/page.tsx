"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift, ArrowLeft, AlertCircle, Mail, Lock, User,
  CheckCircle, Shield, Sparkles, Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const msgs = Object.values(data.details).flat();
          setError(msgs.join(". ") || "Invalid input.");
        } else {
          setError(data.error || "Something went wrong.");
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7E0] via-[#FFFBF5] to-[#F0E8FF]" />
        <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
          <div className="glass rounded-[var(--r-xl)] shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">Account Created!</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              We sent a verification code to <span className="font-medium text-[var(--text)]">{email}</span>.
              Sign in to verify your email and get started.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-[var(--r-sm)] gradient-brand font-semibold text-[var(--text)] shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 btn-press"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7E0] via-[#FFFBF5] to-[#F0E8FF]" />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--primary)] opacity-[0.12] blur-[80px] animate-orb" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-purple-400 opacity-[0.07] blur-[100px] animate-orb-2" />

      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-full hover:bg-white/60 backdrop-blur-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to homepage</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-lg glow-primary">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[var(--text)] tracking-tight">GiftHub</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Start discovering and managing vouchers</p>
        </div>

        <div className="glass rounded-[var(--r-xl)] shadow-xl overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-red-50 border border-red-200 rounded-[var(--r-sm)] px-3 py-2.5 animate-slide-down">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--text)]">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--text)]">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--text)]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-[var(--r-sm)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
                    minLength={8}
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
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

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
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7E0] via-[#FFFBF5] to-[#F0E8FF]">
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center animate-pulse-soft shadow-lg">
            <Gift className="h-6 w-6 text-white" />
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
