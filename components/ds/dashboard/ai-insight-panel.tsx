'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   AI INSIGHT PANEL — AI-powered insights with typewriter effect
   Glass card with purple gradient accent
   ═══════════════════════════════════════════════════════════════ */

export interface AiInsightPanelProps {
  /** Insight text to display with typewriter animation */
  insight?: string;
  /** Suggested questions */
  suggestions?: string[];
  /** Handler when user submits a question */
  onAsk?: (question: string) => void;
  /** Handler when a suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
  /** Loading state (show animated dots) */
  loading?: boolean;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed = 20) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(true); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
}

export function AiInsightPanel({
  insight = '',
  suggestions = [],
  onAsk,
  onSuggestionClick,
  loading = false,
  defaultCollapsed = false,
  className = '',
}: AiInsightPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayed, done } = useTypewriter(collapsed ? '' : insight, 18);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      onAsk?.(input.trim());
      setInput('');
    },
    [input, onAsk],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'var(--ds-bg-glass, rgba(255,255,255,0.03))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
        boxShadow: 'var(--ds-shadow-md)',
      }}
    >
      {/* Dusty-slate gradient accent line */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--ds-gradient-secondary, linear-gradient(135deg, #5e7e92, #7e9cae))' }}
      />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 0%, rgba(94, 126, 146, 0.06), transparent 60%)',
        }}
      />

      {/* Header */}
      <button
        className="relative flex w-full items-center justify-between px-5 py-4"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: 'rgba(94, 126, 146, 0.12)',
              boxShadow: '0 0 12px rgba(94, 126, 146, 0.2)',
            }}
          >
            <Sparkles
              size={16}
              style={{ color: 'var(--ds-secondary, #5e7e92)' }}
            />
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            AI Insights
          </span>
          {loading && <LoadingDots />}
        </div>
        {collapsed ? (
          <ChevronDown size={16} style={{ color: 'var(--ds-text-tertiary)' }} />
        ) : (
          <ChevronUp size={16} style={{ color: 'var(--ds-text-tertiary)' }} />
        )}
      </button>

      {/* Content */}
      <div
        style={{
          maxHeight: collapsed ? 0 : 500,
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transition: `max-height var(--ds-duration-slow, 400ms) var(--ds-ease-default),
                       opacity var(--ds-duration-normal, 250ms) var(--ds-ease-default)`,
        }}
      >
        {/* Insight text */}
        <div className="px-5 pb-3">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--ds-text-secondary, rgba(255,255,255,0.64))' }}
          >
            {loading ? '' : displayed}
            {!done && !loading && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom"
                style={{
                  background: 'var(--ds-secondary, #5e7e92)',
                  animation: 'ds-blink 0.8s step-end infinite',
                }}
              />
            )}
          </p>
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSuggestionClick?.(s);
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
                style={{
                  background: 'var(--ds-bg-surface, #12121a)',
                  color: 'var(--ds-text-secondary)',
                  border: '1px solid var(--ds-border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ds-secondary, #5e7e92)';
                  e.currentTarget.style.color = 'var(--ds-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ds-border-default)';
                  e.currentTarget.style.color = 'var(--ds-text-secondary)';
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Ask AI input */}
        {onAsk && (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-5 pb-4"
          >
            <div
              className="flex flex-1 items-center rounded-xl px-3 py-2"
              style={{
                background: 'var(--ds-bg-surface, #12121a)',
                border: '1px solid var(--ds-border-default)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI a question..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                style={{ color: 'var(--ds-text-primary)' }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="ml-2 shrink-0 rounded-lg p-1.5 transition-all duration-200"
                style={{
                  background: input.trim()
                    ? 'var(--ds-secondary, #5e7e92)'
                    : 'transparent',
                  color: input.trim()
                    ? 'white'
                    : 'var(--ds-text-tertiary)',
                  opacity: input.trim() ? 1 : 0.4,
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes ds-blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Loading dots ── */
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1 h-1 rounded-full"
          style={{
            background: 'var(--ds-secondary, #5e7e92)',
            animation: `ds-dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ds-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

export default AiInsightPanel;
