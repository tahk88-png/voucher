"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

type ConsentState = ConsentChoice | null;

/** Fired on window after the visitor saves a choice; detail is the ConsentChoice. */
export const CONSENT_CHANGE_EVENT = 'cookie-consent-change';

export function CookieConsentBanner() {
  const t = useTranslations("site.cookies");
  const [consent, setConsent] = useState<ConsentState | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch("/api/cookie-consent")
      .then((r) => r.json())
      .then((data) => setConsent(data.consent))
      .catch(() => setConsent(null));
  }, []);

  const visible = consent === null;

  // Let other fixed-position UI (the chat launcher) step aside while open.
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.dataset.cookieBanner = "open";
    else delete root.dataset.cookieBanner;
    return () => {
      delete root.dataset.cookieBanner;
    };
  }, [visible]);

  // Already consented or still loading
  if (!visible) return null;

  async function submit(choice: "accept" | "decline" | "custom") {
    const payload =
      choice === "accept"
        ? { analytics: true, marketing: true, preferences: true }
        : choice === "decline"
          ? { analytics: false, marketing: false, preferences: false }
          : { analytics, marketing, preferences };

    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`cookie-consent POST ${res.status}`);
      setConsent(payload);
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: payload }));
    } catch (err) {
      console.error("Saving cookie preferences failed", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    // Pinned to the bottom edge and compact on phones, so it never sits over
    // the middle of the screen.
    <div
      role="region"
      aria-label={t("regionLabel")}
      className="fixed bottom-0 inset-x-0 z-50 p-2 sm:p-4 md:p-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur shadow-lg p-3 sm:p-5 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm text-[var(--text)]">
            {t.rich("intro", {
              link: (chunks) => (
                <Link href="/privacy" className="underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </p>

          {showSettings && (
            <fieldset className="space-y-2 border-t border-[var(--border)] pt-3">
              <legend className="sr-only">{t("optionalLegend")}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="accent-[var(--primary)]" />
                <span className="font-medium">{t("necessary")}</span>
                <span className="text-[var(--text-muted)]">{t("alwaysOn")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                <span className="font-medium">{t("analytics")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                <span className="font-medium">{t("marketing")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                <span className="font-medium">{t("preferences")}</span>
              </label>
            </fieldset>
          )}

          {saveError && (
            <p role="alert" className="text-xs sm:text-sm text-[var(--danger)]">
              {t("saveError")}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={saving}
              onClick={() => submit("accept")}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]"
            >
              {t("acceptAll")}
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => submit("decline")}>
              {t("declineOptional")}
            </Button>
            {!showSettings ? (
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
                {t("customize")}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => submit("custom")}>
                {t("savePreferences")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
