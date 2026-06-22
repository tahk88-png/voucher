'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  BarChart3,
  TrendingUp,
  Table,
  Hash,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;
  chartType?: string;
}

const SUGGESTED_QUESTIONS = [
  'What was my revenue last week?',
  'Show daily redemptions this month',
  'Top vouchers by revenue last month',
  'How many customers purchased last week?',
  'What is my referral conversion rate?',
  'Show daily revenue trend this month',
  'How many purchases were made yesterday?',
  'What are my best performing vouchers?',
];

const CHART_ICONS: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: TrendingUp,
  table: Table,
  number: Hash,
  pie: BarChart3,
};

export default function AskAnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/merchant/${slug}/analytics/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            data: data.data,
            chartType: data.chartType,
          },
        ]);
      } else {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err.error ?? 'Sorry, I could not process that question.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderData(msg: Message) {
    if (!msg.data) return null;

    const data = msg.data as any;

    if (msg.chartType === 'number') {
      return (
        <div className="mt-3 p-4 bg-[var(--surface-dim)] rounded-xl">
          {typeof data === 'object' &&
            Object.entries(data).map(([key, val]) => (
              <div key={key} className="flex justify-between py-1">
                <span className="text-sm text-[var(--text-muted)] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-sm font-semibold text-[var(--text)]">{String(val)}</span>
              </div>
            ))}
        </div>
      );
    }

    if (msg.chartType === 'table' && Array.isArray(data)) {
      const cols = data.length > 0 ? Object.keys(data[0]) : [];
      return (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
            <thead className="bg-[var(--surface)]">
              <tr>
                {cols.map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-[var(--text-muted)] font-medium capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.slice(0, 10).map((row: any, i: number) => (
                <tr key={i}>
                  {cols.map((col) => (
                    <td key={col} className="px-3 py-2 text-[var(--text)]">
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if ((msg.chartType === 'bar' || msg.chartType === 'line') && Array.isArray(data)) {
      const maxVal = Math.max(...data.map((d: any) => d.revenue ?? d.amount ?? d.count ?? d.value ?? 0), 1);
      return (
        <div className="mt-3 space-y-1.5">
          {data.map((item: any, i: number) => {
            const val = item.revenue ?? item.amount ?? item.count ?? item.value ?? 0;
            const label = item.name ?? item.date ?? `Item ${i + 1}`;
            const widthPct = (val / maxVal) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] w-20 truncate text-right">{label}</span>
                <div className="flex-1 bg-[var(--surface-dim)] rounded h-6 overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded flex items-center px-2"
                    style={{ width: `${Math.max(widthPct, 3)}%` }}
                  >
                    {widthPct > 15 && (
                      <span className="text-[10px] text-white font-medium">{typeof val === 'number' ? val.toFixed(val % 1 === 0 ? 0 : 2) : val}</span>
                    )}
                  </div>
                </div>
                {widthPct <= 15 && (
                  <span className="text-xs text-[var(--text-muted)]">{typeof val === 'number' ? val.toFixed(val % 1 === 0 ? 0 : 2) : val}</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--primary)]" />
          <h1 className="text-2xl font-semibold text-[var(--text)]">Ask Your Data</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Ask questions about your business data in natural language
        </p>
      </div>

      {/* Chat messages */}
      <WarmCard padding="none" className="bg-[var(--surface)] min-h-[400px] flex flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-[var(--text-muted)]">
              <Sparkles className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">Ask anything about your data</p>
              <p className="text-sm">Try one of the suggestions below</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-dim)] text-[var(--text)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'assistant' && msg.chartType && (
                    (() => {
                      const Icon = CHART_ICONS[msg.chartType] ?? Hash;
                      return <Icon className="h-4 w-4 mt-0.5 shrink-0 text-[var(--text-muted)]" />;
                    })()
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{msg.content}</p>
                    {msg.role === 'assistant' && renderData(msg)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface-dim)] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border)] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your data..."
              disabled={loading}
              className="flex-1"
            />
            <WarmButton type="submit" size="sm" disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </WarmButton>
          </form>
        </div>
      </WarmCard>

      {/* Suggested Questions */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Suggested Questions</h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSubmit(q)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-dim)] text-[var(--text)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </WarmCard>
    </div>
  );
}
