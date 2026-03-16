'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/ui/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
        Contact Us
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
        Have a question? We&apos;d love to hear from you.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Mail size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Email</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>support@voucherplatform.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Live Chat</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Available via the chat widget in the bottom-right corner</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Office</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tallinn, Estonia</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Hours</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Mon-Fri, 9:00-18:00 EET</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
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
              <p className="text-sm text-green-600">Message sent! We&apos;ll get back to you soon.</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-600">Failed to send. Please try again or use the chat widget.</p>
            )}

            <WarmButton type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </WarmButton>
          </form>
        </div>
      </div>
    </main>
  );
}
