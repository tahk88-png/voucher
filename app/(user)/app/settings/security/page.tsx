"use client";

import { useState, useEffect, useCallback } from "react";
import { WarmCard } from "@/components/warm-card";
import { WarmButton } from "@/components/warm-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  Smartphone,
  Download,
} from "lucide-react";
import Link from "next/link";
import { PasskeyManager } from "@/components/settings/passkey-manager";

type SetupStep = "idle" | "scanning" | "verifying" | "complete" | "disabling";

export default function SecurityPage() {
  const [step, setStep] = useState<SetupStep>("idle");
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Setup state
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Disable state
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  // Clipboard
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      // We check if TOTP is enabled by trying setup — if it returns 400 with "already enabled", it's on
      // Better approach: just try to fetch, and handle the response
      const res = await fetch("/api/auth/totp/setup", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        // Setup returned successfully, meaning 2FA is NOT yet enabled (or was pending)
        // Clean up — we don't want to start setup automatically
        setTotpEnabled(false);
      } else if (data.error?.includes("already enabled")) {
        setTotpEnabled(true);
      } else {
        setTotpEnabled(false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function startSetup() {
    setError(null);
    setStep("scanning");
    try {
      const res = await fetch("/api/auth/totp/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start setup");
        setStep("idle");
        return;
      }
      setSecret(data.secret);
      setUri(data.uri);
      setBackupCodes(data.backupCodes);
    } catch {
      setError("Failed to start setup");
      setStep("idle");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setVerifying(false);
        return;
      }
      setTotpEnabled(true);
      setStep("complete");
      setSuccessMsg("Two-factor authentication is now enabled!");
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDisabling(true);
    try {
      const res = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to disable 2FA");
        setDisabling(false);
        return;
      }
      setTotpEnabled(false);
      setStep("idle");
      setDisableCode("");
      setSuccessMsg("Two-factor authentication has been disabled");
    } catch {
      setError("Failed to disable 2FA");
    } finally {
      setDisabling(false);
    }
  }

  function copyToClipboard(text: string, type: "secret" | "backup") {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
    });
  }

  function downloadBackupCodes() {
    const content = [
      "GiftHub - Two-Factor Authentication Backup Codes",
      "================================================",
      "",
      "Save these codes in a safe place. Each code can only be used once.",
      "",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gifthub-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/app/settings"
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2721]">Security</h1>
            <p className="text-sm text-[#6B5744]">Loading...</p>
          </div>
        </div>
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        </WarmCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">Security</h1>
          <p className="text-sm text-[#6B5744]">
            Manage two-factor authentication and security settings
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--r-sm)] px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[var(--r-sm)] px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status card */}
      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${
              totpEnabled ? "bg-green-50" : "bg-[#FFF9ED]"
            }`}
          >
            {totpEnabled ? (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            ) : (
              <Shield className="h-6 w-6 text-[#8B7355]" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-[#2D2721]">
              Two-Factor Authentication
            </div>
            <p className="text-sm text-[#6B5744] mt-1">
              {totpEnabled
                ? "Your account is protected with an authenticator app."
                : "Add an extra layer of security to your account by requiring a code from your authenticator app."}
            </p>
            <div className="mt-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  totpEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {totpEnabled ? "Enabled" : "Not enabled"}
              </span>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Setup flow */}
      {!totpEnabled && step === "idle" && (
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="text-center py-4">
            <Smartphone className="h-10 w-10 text-[#8B7355] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#2D2721] mb-1">
              Set up authenticator app
            </h3>
            <p className="text-sm text-[#6B5744] mb-4 max-w-sm mx-auto">
              Use an app like Google Authenticator, Authy, or 1Password to
              generate verification codes.
            </p>
            <WarmButton onClick={startSetup}>
              <Key className="h-4 w-4 mr-2" />
              Enable 2FA
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {step === "scanning" && (
        <>
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-semibold text-[#2D2721]">
                  Scan QR code or enter key manually
                </h3>
              </div>

              <div className="flex flex-col items-center gap-4">
                {/* QR Code - rendered as a link to otpauth URI */}
                <div className="p-4 bg-white rounded-xl border border-[var(--border)] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`}
                    alt="Scan this QR code with your authenticator app"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs text-[#8B7355] mb-2">
                    Or enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 bg-[#FFF9ED] rounded-lg px-3 py-2">
                    <code className="text-sm font-mono text-[#2D2721] select-all break-all">
                      {secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(secret, "secret")}
                      className="p-1 hover:bg-white/50 rounded transition-colors shrink-0"
                      title="Copy secret"
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-[#8B7355]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-semibold text-[#2D2721]">
                  Enter verification code
                </h3>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-[var(--text)]">
                    6-digit code from your app
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-1 text-center text-lg tracking-[0.3em] font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <WarmButton
                    type="submit"
                    isLoading={verifying}
                    disabled={verifyCode.length !== 6}
                    fullWidth
                  >
                    Verify and enable
                  </WarmButton>
                  <WarmButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("idle");
                      setVerifyCode("");
                      setError(null);
                    }}
                  >
                    Cancel
                  </WarmButton>
                </div>
              </form>
            </div>
          </WarmCard>
        </>
      )}

      {step === "complete" && backupCodes.length > 0 && (
        <WarmCard padding="lg" className="bg-white border border-green-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-[#2D2721]">
                Save your backup codes
              </h3>
            </div>

            <p className="text-sm text-[#6B5744]">
              Store these codes safely. If you lose access to your authenticator
              app, you can use one of these codes to sign in. Each code can only
              be used once.
            </p>

            <div className="bg-[#FFF9ED] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code
                    key={i}
                    className="text-sm font-mono text-[#2D2721] bg-white rounded px-3 py-1.5 text-center border border-[var(--border)]"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <WarmButton
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(backupCodes.join("\n"), "backup")
                }
              >
                {copiedBackup ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copiedBackup ? "Copied!" : "Copy codes"}
              </WarmButton>
              <WarmButton
                variant="outline"
                size="sm"
                onClick={downloadBackupCodes}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </WarmButton>
            </div>

            <WarmButton
              fullWidth
              onClick={() => {
                setStep("idle");
                setBackupCodes([]);
                setSecret("");
                setUri("");
                setVerifyCode("");
              }}
            >
              Done
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {/* Disable 2FA */}
      {totpEnabled && step === "idle" && (
        <WarmCard padding="lg" className="bg-white border border-red-100">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-red-50 flex items-center justify-center shrink-0">
              <ShieldOff className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#2D2721]">
                Disable two-factor authentication
              </div>
              <div className="text-sm text-[#6B5744]">
                This will remove the extra security layer from your account.
              </div>
            </div>
          </div>
          <WarmButton
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => {
              setStep("disabling");
              setError(null);
              setSuccessMsg(null);
            }}
          >
            Disable 2FA
          </WarmButton>
        </WarmCard>
      )}

      {step === "disabling" && (
        <WarmCard padding="lg" className="bg-white border border-red-200">
          <form onSubmit={handleDisable} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#2D2721]">
              Confirm disable 2FA
            </h3>
            <p className="text-sm text-[#6B5744]">
              Enter your current 6-digit code from your authenticator app, or a
              backup code.
            </p>
            <div>
              <Label className="text-sm font-medium text-[var(--text)]">
                Verification code
              </Label>
              <Input
                type="text"
                placeholder="000000 or XXXX-XXXX"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <WarmButton
                type="submit"
                isLoading={disabling}
                disabled={!disableCode.trim()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirm disable
              </WarmButton>
              <WarmButton
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("idle");
                  setDisableCode("");
                  setError(null);
                }}
              >
                Cancel
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {/* Passkeys (WebAuthn) */}
      <PasskeyManager />

      {/* Quick links */}
      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="text-sm font-semibold text-[#2D2721] mb-3">
          Security quick links
        </div>
        <div className="space-y-2">
          <Link
            href="/app/settings/sessions"
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
          >
            <Shield className="h-4 w-4" />
            View active sessions
          </Link>
          <Link
            href="/app/settings"
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
          >
            <Key className="h-4 w-4" />
            Change password
          </Link>
        </div>
      </WarmCard>
    </div>
  );
}
