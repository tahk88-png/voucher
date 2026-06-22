"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
} | null;

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    fetch("/api/cookie-consent")
      .then((r) => r.json())
      .then((data) => setConsent(data.consent))
      .catch(() => setConsent(null));
  }, []);

  // Already consented or still loading
  if (consent === undefined || consent !== null) return null;

  async function submit(choice: "accept" | "decline" | "custom") {
    const payload =
      choice === "accept"
        ? { analytics: true, marketing: true, preferences: true }
        : choice === "decline"
          ? { analytics: false, marketing: false, preferences: false }
          : { analytics, marketing, preferences };

    try {
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setConsent(payload);
    } catch {
      // Fail silently — user can retry
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border bg-white/95 backdrop-blur shadow-lg p-5 dark:bg-neutral-900/95 dark:border-neutral-700">
        <div className="space-y-3">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            We use cookies to improve your experience. Necessary cookies are
            always active. You can choose which optional cookies to allow.
          </p>

          {showSettings && (
            <div className="space-y-2 border-t pt-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="accent-amber-600" />
                <span className="font-medium">Necessary</span>
                <span className="text-neutral-500">(always on)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="accent-amber-600"
                />
                <span className="font-medium">Analytics</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="accent-amber-600"
                />
                <span className="font-medium">Marketing</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="accent-amber-600"
                />
                <span className="font-medium">Preferences</span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => submit("accept")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Accept all
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => submit("decline")}
            >
              Decline optional
            </Button>
            {!showSettings ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(true)}
              >
                Customize
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => submit("custom")}
              >
                Save preferences
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
