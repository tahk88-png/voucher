'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare } from 'lucide-react';
import { publicContactEmail } from '@/lib/contact-address';

export default function ContactClient({ contactEmail }: { contactEmail: string }) {
  const t = useTranslations('contact');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'unavailable'>('idle');
  // A dev/placeholder address (support@example.com, support@localhost) is
  // never presented as a real mailbox.
  const shownEmail = publicContactEmail(contactEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else if (res.status === 503) {
        setStatus('unavailable');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
        {t('title')}
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
        {t('subtitle')}
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          {shownEmail && (
            <div className="flex items-start gap-3">
              <Mail size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t('email')}</p>
                <a
                  href={`mailto:${shownEmail}`}
                  className="text-sm underline underline-offset-2 break-all"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {shownEmail}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t('assistantTitle')}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('assistantText')}
              </p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">{t('subject')}</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="message">{t('message')}</Label>
              <textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
                className="w-full rounded-md px-3 py-2 text-sm"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {status === 'sent' && (
              <p role="status" className="text-sm text-green-800">{t('sent')}</p>
            )}
            {status === 'unavailable' && (
              <p role="alert" className="text-sm text-red-700">
                {shownEmail ? t('unavailableWithEmail', { email: shownEmail }) : t('unavailable')}
              </p>
            )}
            {status === 'error' && (
              <p role="alert" className="text-sm text-red-700">{t('error')}</p>
            )}

            <WarmButton type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? t('sending') : t('send')}
            </WarmButton>
          </form>
        </div>
      </div>
    </div>
  );
}
