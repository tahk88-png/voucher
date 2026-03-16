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

  useEffect(() => {
    fetch(`/api/merchant/${slug}/webhooks`)
      .then((res) => res.json())
      .then(setEndpoints)
      .catch(() => showError('Failed to load webhooks'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCreate = async () => {
    if (!newUrl || !newEvents.length) {
      showError('URL and at least one event required');
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
      showSuccess('Webhook created');
    } catch {
      showError('Failed to create webhook');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/merchant/${slug}/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      showSuccess('Webhook deleted');
    } catch {
      showError('Failed to delete webhook');
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
      showError('Failed to update webhook');
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
        showSuccess(`Test delivered! Status: ${result.statusCode}`);
      } else {
        showError(`Test failed: ${result.error || `Status ${result.statusCode}`}`);
      }
    } catch {
      showError('Failed to send test webhook');
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
      showError('Failed to load deliveries');
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
          <h1 className="text-2xl font-semibold text-[var(--text)]">Webhooks</h1>
          <p className="text-sm text-[var(--text-muted)]">Receive event notifications via HTTP</p>
        </div>
        <WarmButton size="sm" onClick={() => { setShowForm(!showForm); setNewSecret(null); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Webhook
        </WarmButton>
      </div>

      {newSecret && (
        <WarmCard padding="lg" className="bg-green-50 border-green-200">
          <p className="text-sm font-medium text-green-800 mb-2">Webhook secret (shown only once):</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-white px-3 py-2 rounded border flex-1 break-all">{newSecret}</code>
            <WarmButton
              size="sm"
              variant="outline"
              onClick={() => { navigator.clipboard.writeText(newSecret); showSuccess('Copied!'); }}
            >
              <Copy className="h-4 w-4" />
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {showForm && (
        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">New Webhook</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-api.com/webhook"
                className="border-[var(--border)]"
              />
            </div>
            <div>
              <Label>Events</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {AVAILABLE_EVENTS.map((event) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      newEvents.includes(event)
                        ? 'bg-[var(--primary)] text-[var(--text)] border-[var(--primary)]'
                        : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <WarmButton onClick={handleCreate} disabled={!newUrl || !newEvents.length}>
              Create Webhook
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : endpoints.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center">
          <p className="text-[var(--text-muted)]">No webhooks configured</p>
        </WarmCard>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <WarmCard key={ep.id} padding="md" className="bg-white">
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
                    Created {new Date(ep.createdAt).toLocaleDateString()}
                    {ep._count ? ` | ${ep._count.deliveries} deliveries` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(ep.id)}
                    disabled={testingId === ep.id}
                  >
                    <Send className="h-4 w-4" />
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDeliveries(ep.id)}
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
                    {ep.isActive ? 'Disable' : 'Enable'}
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ep.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </WarmButton>
                </div>
              </div>

              {/* Delivery log viewer */}
              {expandedId === ep.id && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
                    Delivery Log
                  </h3>
                  {loadingDeliveries ? (
                    <p className="text-xs text-[var(--text-muted)]">Loading...</p>
                  ) : deliveries.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No deliveries yet</p>
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
                              {d.statusCode ? `HTTP ${d.statusCode}` : 'Failed'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[var(--text-muted)]">
                            <span>{d.attempts} attempt(s)</span>
                            <span>{new Date(d.createdAt).toLocaleString()}</span>
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
