"use client";

import { useState, useEffect, useCallback } from "react";
import { WarmCard } from "@/components/warm-card";
import { WarmButton } from "@/components/warm-button";
import {
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  AlertTriangle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface SessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke session");
      }
      setSuccessMsg("Session revoked successfully");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllSessions() {
    setRevokingAll(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAll: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke sessions");
      }
      setSuccessMsg("All sessions have been revoked");
      setSessions([]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke sessions"
      );
    } finally {
      setRevokingAll(false);
    }
  }

  function getDeviceIcon(deviceInfo: string) {
    const lower = deviceInfo.toLowerCase();
    if (
      lower.includes("android") ||
      lower.includes("iphone") ||
      lower.includes("ios")
    ) {
      return <Smartphone className="h-5 w-5 text-[#8B7355]" />;
    }
    return <Monitor className="h-5 w-5 text-[#8B7355]" />;
  }

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
          <h1 className="text-2xl font-semibold text-[#2D2721]">
            Active Sessions
          </h1>
          <p className="text-sm text-[#6B5744]">
            Manage your active sessions and sign out from other devices
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--r-sm)] px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[var(--r-sm)] px-3 py-2.5">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-3 w-1/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </WarmCard>
      ) : sessions.length === 0 ? (
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-[#8B7355] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#6B5744]">
              No active sessions found. You are using JWT-based authentication.
            </p>
          </div>
        </WarmCard>
      ) : (
        <>
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div className="divide-y divide-[var(--border)]">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] flex items-center justify-center shrink-0">
                    {getDeviceIcon(s.deviceInfo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#2D2721] truncate">
                        {s.deviceInfo}
                      </span>
                      {s.isCurrent && (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#8B7355] flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {s.ipAddress}
                      </span>
                      <span className="text-xs text-[#8B7355] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(s.lastActiveAt)}
                      </span>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <WarmButton
                      variant="outline"
                      size="sm"
                      isLoading={revoking === s.id}
                      onClick={() => revokeSession(s.id)}
                      disabled={revoking !== null}
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1" />
                      Log out
                    </WarmButton>
                  )}
                </div>
              ))}
            </div>
          </WarmCard>

          {sessions.length > 1 && (
            <WarmCard padding="lg" className="bg-white border border-red-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#2D2721]">
                    Log out all other devices
                  </div>
                  <div className="text-sm text-[#6B5744]">
                    End all other active sessions. You will stay logged in on
                    this device.
                  </div>
                </div>
                <WarmButton
                  variant="outline"
                  size="sm"
                  isLoading={revokingAll}
                  onClick={revokeAllSessions}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Log out all
                </WarmButton>
              </div>
            </WarmCard>
          )}
        </>
      )}
    </div>
  );
}
