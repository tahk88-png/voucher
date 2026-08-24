'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck, Plus, Check, X, Clock } from 'lucide-react';
import { showError } from '@/lib/toast-helpers';

interface Appointment {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceCents: number;
  currency: string;
  status: string;
  notes?: string;
  user?: { name: string; email: string } | null;
}

export default function AppointmentsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    serviceName: '',
    startTime: '',
    endTime: '',
    priceCents: 0,
    notes: '',
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const qs = filter !== 'all' ? `?status=${filter}` : '';
    const res = await fetch(`/api/merchant/${slug}/appointments${qs}`);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments || []);
    }
    setLoading(false);
  }, [slug, filter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    // Guard against a double-click creating duplicate availability slots.
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ serviceName: '', startTime: '', endTime: '', priceCents: 0, notes: '' });
        fetchAppointments();
      } else {
        showError('Could not create the availability slot. Please try again.');
      }
    } catch {
      showError('Could not reach the server. Check your connection and try again.');
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/merchant/${slug}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  }

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#ef4444',
    completed: '#6366f1',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            <CalendarCheck style={{ display: 'inline', marginRight: 8 }} size={24} />
            Appointments
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage bookings and availability</p>
        </div>
        <WarmButton onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Create Slot
        </WarmButton>
      </div>

      {showForm && (
        <WarmCard style={{ marginBottom: 24, padding: 24 }}>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>Service Name</Label>
              <Input value={form.serviceName} onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))} required />
            </div>
            <div>
              <Label>Price (cents)</Label>
              <Input type="number" value={form.priceCents} onChange={e => setForm(f => ({ ...f, priceCents: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <WarmButton type="submit" disabled={creating} isLoading={creating}>
                {creating ? 'Creating…' : 'Create Availability Slot'}
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--border)',
            background: filter === s ? 'var(--primary)' : 'var(--surface)', color: filter === s ? '#fff' : 'var(--text)',
            cursor: 'pointer',
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : appointments.length === 0 ? (
        <WarmCard style={{ padding: 48, textAlign: 'center' }}>
          <CalendarCheck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No appointments found</p>
        </WarmCard>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {appointments.map(apt => (
            <WarmCard key={apt.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--text)' }}>{apt.serviceName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />
                    {new Date(apt.startTime).toLocaleString()} — {new Date(apt.endTime).toLocaleTimeString()}
                  </p>
                  {apt.user && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Booked by: {apt.user.name || apt.user.email}</p>}
                  {apt.priceCents > 0 && <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{(apt.priceCents / 100).toFixed(2)} {apt.currency}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: `${statusColors[apt.status] || '#888'}22`, color: statusColors[apt.status] || '#888',
                  }}>
                    {apt.status}
                  </span>
                  {apt.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(apt.id, 'confirmed')} style={{ padding: 4, cursor: 'pointer', color: '#10b981', background: 'none', border: 'none' }}><Check size={18} /></button>
                      <button onClick={() => updateStatus(apt.id, 'cancelled')} style={{ padding: 4, cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none' }}><X size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}
