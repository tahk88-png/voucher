'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { useToast } from '@/hooks/use-toast';

interface Category {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  required?: boolean;
}

export default function NotificationPreferencesForm({
  merchantSlug,
  categories,
  initialPreferences,
}: {
  merchantSlug: string;
  categories: Category[];
  initialPreferences: Record<string, boolean>;
}) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const togglePref = (key: string, required?: boolean) => {
    if (required) return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Only send non-required keys — server rejects required overrides
      // anyway, but there's no reason to ship them.
      const payload: Record<string, boolean> = {};
      for (const cat of categories) {
        if (cat.required) continue;
        payload[cat.key] = !!prefs[cat.key];
      }
      const res = await fetch(`/api/merchant/${merchantSlug}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: payload }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPrefs(data.preferences);
      setDirty(false);
      toast({ title: 'Preferences saved' });
    } catch {
      toast({
        title: 'Save failed',
        description: 'Could not update your notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
      <ul className="space-y-4">
        {categories.map((cat) => {
          const enabled = !!prefs[cat.key];
          return (
            <li
              key={cat.key}
              className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text)]">{cat.label}</p>
                  {cat.required ? (
                    <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      Required
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{cat.description}</p>
              </div>
              <label className="inline-flex items-center cursor-pointer select-none">
                <span className="sr-only">Toggle {cat.label}</span>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled}
                  disabled={cat.required}
                  onChange={() => togglePref(cat.key, cat.required)}
                />
                <span
                  className={[
                    'w-11 h-6 rounded-full transition-colors relative',
                    enabled ? 'bg-[var(--primary)]' : 'bg-gray-300',
                    cat.required ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      enabled ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-end gap-3">
        <span className="text-xs text-[var(--text-muted)]">
          {dirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <WarmButton onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </WarmButton>
      </div>
    </WarmCard>
  );
}
