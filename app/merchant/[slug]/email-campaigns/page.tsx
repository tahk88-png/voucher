'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Send, Eye, Trash2, GripVertical, ArrowUp, ArrowDown, Clock } from 'lucide-react';

type SectionType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'voucher-card';

interface EmailSection {
  type: SectionType;
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  src?: string;
  alt?: string;
  label?: string;
  href?: string;
  color?: string;
  voucherTitle?: string;
  voucherValue?: string;
  voucherCode?: string;
  voucherExpiry?: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipientFilter: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
  { type: 'header', label: 'Header', icon: 'H' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: 'I' },
  { type: 'button', label: 'Button', icon: 'B' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'voucher-card', label: 'Voucher', icon: 'V' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function SectionEditor({ section, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  section: EmailSection;
  onChange: (section: EmailSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-[var(--text-muted)] cursor-grab" />
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">{section.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30" aria-label="Move up">
            <ArrowUp className="h-3 w-3" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30" aria-label="Move down">
            <ArrowDown className="h-3 w-3" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500" aria-label="Remove section">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {section.type === 'header' && (
        <div className="space-y-2">
          <Input placeholder="Title" value={section.title || ''} onChange={e => onChange({ ...section, title: e.target.value })} />
          <Input placeholder="Subtitle (optional)" value={section.subtitle || ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} />
        </div>
      )}
      {section.type === 'text' && (
        <textarea
          className="w-full border border-[var(--border)] rounded-md p-2 text-sm min-h-[80px] resize-y"
          placeholder="Enter text content..."
          value={section.content || ''}
          onChange={e => onChange({ ...section, content: e.target.value })}
        />
      )}
      {section.type === 'image' && (
        <div className="space-y-2">
          <Input placeholder="Image URL" value={section.src || ''} onChange={e => onChange({ ...section, src: e.target.value })} />
          <Input placeholder="Alt text" value={section.alt || ''} onChange={e => onChange({ ...section, alt: e.target.value })} />
        </div>
      )}
      {section.type === 'button' && (
        <div className="space-y-2">
          <Input placeholder="Button label" value={section.label || ''} onChange={e => onChange({ ...section, label: e.target.value })} />
          <Input placeholder="Button URL" value={section.href || ''} onChange={e => onChange({ ...section, href: e.target.value })} />
          <Input type="color" value={section.color || '#8B7355'} onChange={e => onChange({ ...section, color: e.target.value })} />
        </div>
      )}
      {section.type === 'divider' && (
        <p className="text-xs text-[var(--text-muted)]">Horizontal divider line</p>
      )}
      {section.type === 'voucher-card' && (
        <div className="space-y-2">
          <Input placeholder="Voucher title" value={section.voucherTitle || ''} onChange={e => onChange({ ...section, voucherTitle: e.target.value })} />
          <Input placeholder="Value (e.g. 20% OFF)" value={section.voucherValue || ''} onChange={e => onChange({ ...section, voucherValue: e.target.value })} />
          <Input placeholder="Code (e.g. SAVE20)" value={section.voucherCode || ''} onChange={e => onChange({ ...section, voucherCode: e.target.value })} />
          <Input placeholder="Expiry (e.g. Dec 31, 2026)" value={section.voucherExpiry || ''} onChange={e => onChange({ ...section, voucherExpiry: e.target.value })} />
        </div>
      )}
    </div>
  );
}

export default function EmailCampaignsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'redeemed_30d' | 'inactive'>('all');
  const [sections, setSections] = useState<EmailSection[]>([
    { type: 'header', id: generateId(), title: '', subtitle: '' },
    { type: 'text', id: generateId(), content: '' },
  ]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/email-campaigns`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const addSection = (type: SectionType) => {
    setSections(prev => [...prev, { type, id: generateId() }]);
  };

  const updateSection = (index: number, section: EmailSection) => {
    setSections(prev => prev.map((s, i) => i === index ? section : s));
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections(prev => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim()) {
      toast({ title: 'Missing fields', description: 'Name and subject are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/email-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          sections,
          recipientFilter,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast({ title: 'Campaign created' });
      setShowCreate(false);
      setName('');
      setSubject('');
      setSections([
        { type: 'header', id: generateId(), title: '', subtitle: '' },
        { type: 'text', id: generateId(), content: '' },
      ]);
      setScheduledAt('');
      fetchCampaigns();
    } catch {
      toast({ title: 'Error', description: 'Failed to create campaign.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign now?')) return;
    try {
      const res = await fetch(`/api/merchant/${slug}/email-campaigns/${campaignId}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      const data = await res.json();
      toast({ title: 'Campaign sent', description: `Delivered to ${data.recipientCount} recipients.` });
      fetchCampaigns();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await fetch(`/api/merchant/${slug}/email-campaigns/${campaignId}`, { method: 'DELETE' });
      toast({ title: 'Campaign deleted' });
      fetchCampaigns();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Email Campaigns</h1>
        </div>
        <WarmButton onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> New Campaign
        </WarmButton>
      </div>

      {showCreate && (
        <WarmCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Create Campaign</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Builder */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale Newsletter" />
              </div>
              <div>
                <Label htmlFor="campaign-subject">Subject Line</Label>
                <Input id="campaign-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Don't miss our summer deals!" />
              </div>
              <div>
                <Label htmlFor="recipient-filter">Recipients</Label>
                <select
                  id="recipient-filter"
                  value={recipientFilter}
                  onChange={e => setRecipientFilter(e.target.value as 'all' | 'redeemed_30d' | 'inactive')}
                  className="w-full border border-[var(--border)] rounded-md p-2 text-sm bg-white"
                >
                  <option value="all">All customers</option>
                  <option value="redeemed_30d">Redeemed in last 30 days</option>
                  <option value="inactive">Inactive customers</option>
                </select>
              </div>
              <div>
                <Label htmlFor="scheduled-at">Schedule (optional)</Label>
                <Input id="scheduled-at" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>

              <div>
                <Label>Email Sections</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SECTION_TYPES.map(st => (
                    <button
                      key={st.type}
                      onClick={() => addSection(st.type)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <span className="font-bold mr-1">{st.icon}</span> {st.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {sections.map((section, i) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      onChange={s => updateSection(i, s)}
                      onRemove={() => removeSection(i)}
                      onMoveUp={() => moveSection(i, -1)}
                      onMoveDown={() => moveSection(i, 1)}
                      isFirst={i === 0}
                      isLast={i === sections.length - 1}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <WarmButton onClick={handleCreate} disabled={submitting}>
                  {submitting ? 'Creating...' : scheduledAt ? 'Schedule Campaign' : 'Save as Draft'}
                </WarmButton>
                <WarmButton variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </WarmButton>
              </div>
            </div>

            {/* Right: Preview */}
            {showPreview && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#F5F0EB]">
                <div className="bg-[var(--surface)] px-3 py-2 border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                  Preview
                </div>
                <div className="p-4">
                  <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto space-y-4">
                    {sections.map(s => (
                      <div key={s.id}>
                        {s.type === 'header' && (
                          <div className="text-center">
                            <h2 className="text-xl font-bold text-[#2D2721]">{s.title || 'Header Title'}</h2>
                            {s.subtitle && <p className="text-sm text-[#6B5744] mt-1">{s.subtitle}</p>}
                          </div>
                        )}
                        {s.type === 'text' && <p className="text-sm text-[#2D2721] leading-relaxed">{s.content || 'Text content...'}</p>}
                        {s.type === 'image' && (
                          <div className="text-center">
                            {s.src ? (
                              <img src={s.src} alt={s.alt || ''} className="max-w-full rounded-lg mx-auto" />
                            ) : (
                              <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm">Image placeholder</div>
                            )}
                          </div>
                        )}
                        {s.type === 'button' && (
                          <div className="text-center">
                            <span className="inline-block px-6 py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: s.color || '#8B7355' }}>
                              {s.label || 'Button'}
                            </span>
                          </div>
                        )}
                        {s.type === 'divider' && <hr className="border-t border-[#E8E0D8]" />}
                        {s.type === 'voucher-card' && (
                          <div className="border-2 border-dashed border-[#8B7355] rounded-xl p-4 text-center bg-[#FAF7F4]">
                            <p className="text-xs text-[#6B5744] uppercase tracking-wider">Voucher</p>
                            <p className="text-lg font-bold text-[#2D2721]">{s.voucherTitle || 'Voucher'}</p>
                            <p className="text-2xl font-extrabold text-[#8B7355]">{s.voucherValue || '---'}</p>
                            {s.voucherCode && <code className="text-sm bg-white px-3 py-1 rounded border border-[#E8E0D8] inline-block mt-1">{s.voucherCode}</code>}
                            {s.voucherExpiry && <p className="text-xs text-[#9B8A7A] mt-1">Valid until {s.voucherExpiry}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </WarmCard>
      )}

      {/* Campaign List */}
      <WarmCard padding="none">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-muted)]">
            <Mail className="h-8 w-8 opacity-30" />
            <p>No email campaigns yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Recipients</th>
                  <th className="px-4 py-3 font-semibold">Opens</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{c.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{c.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{c.recipientCount}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{c.openCount}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.status !== 'sent' && (
                          <WarmButton size="sm" onClick={() => handleSend(c.id)}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </WarmButton>
                        )}
                        {c.status === 'scheduled' && (
                          <span className="flex items-center text-xs text-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : ''}
                          </span>
                        )}
                        <WarmButton size="sm" variant="outline" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </WarmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WarmCard>
    </div>
  );
}
