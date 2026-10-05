'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { Plus, Trash2, Copy, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const AVAILABLE_EVENTS = [
  'voucher.redeemed',
  'voucher.purchased',
  'voucher.expired',
  'campaign.started',
  'campaign.ended',
  'ticket.redeemed',
  'gift_card.redeemed',
  'redemption.created',
  'redemption.confirmed',
  'review.created',
  'subscription.created',
  'booking.created',
];

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  response: string | null;
  attempts: number;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

export default function WebhooksPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const t = useTranslations('merchantTeam.webhooks');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : locale;

  useEffect(() => {
    fetch(`/api/merchant/${slug}/webhooks`)
      .then((res) => res.json())
      .then(setEndpoints)
      .catch(() => showError(t('loadFailed')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  const handleCreate = async () => {
    if (!newUrl || !newEvents.length) {
      showError(t('required'));
      return;
    }
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setNewSecret(created.secret);
      setEndpoints((prev) => [created, ...prev]);
      setNewUrl('');
      setNewEvents([]);
      showSuccess(t('created'));
    } catch {
      showError(t('createFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      showSuccess(t('deleted'));
    } catch {
      showError(t('deleteFailed'));
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      setEndpoints((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !isActive } : e))
      );
    } catch {
      showError(t('updateFailed'));
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks/${id}/test`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success) {
        showSuccess(t('testDelivered', { status: String(result.statusCode) }));
      } else {
        showError(t('testFailed', { error: result.error || t('statusCode', { status: String(result.statusCode) }) }));
      }
    } catch {
      showError(t('testSendFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleViewDeliveries = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDeliveries([]);
      return;
    }
    setExpandedId(id);
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch {
      showError(t('loadDeliveriesFailed'));
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
        </div>
        <WarmButton size="sm" onClick={() => { setShowForm(!showForm); setNewSecret(null); }}>
          <Plus className="h-4 w-4 mr-1" /> {t('addWebhook')}
        </WarmButton>
      </div>

      {newSecret && (
        <WarmCard padding="lg" className="bg-green-50 border-green-200">
          <p className="text-sm font-medium text-green-800 mb-2">{t('secretNotice')}</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-[var(--surface)] px-3 py-2 rounded border flex-1 break-all">{newSecret}</code>
            <WarmButton
              size="sm"
              variant="outline"
              onClick={() => { navigator.clipboard.writeText(newSecret); showSuccess(t('copied')); }}
              aria-label={t('copySecret')}
            >
              <Copy className="h-4 w-4" />
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {showForm && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('newTitle')}</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">{t('endpointUrl')}</Label>
              <Input
                id="webhook-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={t('endpointPlaceholder')}
                className="border-[var(--border)]"
              />
            </div>
            <div>
              <Label>{t('events')}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {AVAILABLE_EVENTS.map((event) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      newEvents.includes(event)
                        ? 'bg-[var(--primary)] text-[var(--text)] border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <WarmButton onClick={handleCreate} disabled={!newUrl || !newEvents.length}>
              {t('submit')}
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">{t('loading')}</p>
      ) : endpoints.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <p className="text-[var(--text-muted)]">{t('empty')}</p>
        </WarmCard>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <WarmCard key={ep.id} padding="md" className="bg-[var(--surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ep.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-sm font-medium text-[var(--text)] truncate">{ep.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ep.events.map((ev) => (
                      <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-faint)] mt-2">
                    {t('createdOn', { date: new Date(ep.createdAt).toLocaleDateString(dateLocale) })}
                    {ep._count ? ` | ${t('deliveriesCount', { count: ep._count.deliveries })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(ep.id)}
                    disabled={testingId === ep.id}
                    aria-label={t('sendTest')}
                    title={t('sendTest')}
                  >
                    <Send className="h-4 w-4" />
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDeliveries(ep.id)}
                    aria-label={t('viewDeliveries')}
                    aria-expanded={expandedId === ep.id}
                  >
                    {expandedId === ep.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(ep.id, ep.isActive)}
                  >
                    {ep.isActive ? t('disable') : t('enable')}
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ep.id)}
                    aria-label={t('deleteWebhook')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </WarmButton>
                </div>
              </div>

              {/* Delivery log viewer */}
              {expandedId === ep.id && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
                    {t('deliveryLog')}
                  </h3>
                  {loadingDeliveries ? (
                    <p className="text-xs text-[var(--text-muted)]">{t('loading')}</p>
                  ) : deliveries.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">{t('noDeliveries')}</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {deliveries.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                d.statusCode && d.statusCode >= 200 && d.statusCode < 300
                                  ? 'bg-green-500'
                                  : d.statusCode
                                  ? 'bg-red-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            <span className="font-medium text-[var(--text)]">{d.event}</span>
                            <span className="text-[var(--text-muted)]">
                              {d.statusCode ? `HTTP ${d.statusCode}` : t('deliveryFailed')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[var(--text-muted)]">
                            <span>{t('attempts', { count: d.attempts })}</span>
                            <span>{new Date(d.createdAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}
