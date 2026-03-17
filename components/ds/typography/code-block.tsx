'use client';

import React, { useState, useCallback, useMemo } from 'react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  copyButton?: boolean;
  className?: string;
}

/* ─── Minimal syntax highlighter (no external deps) ─── */
interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain';
  value: string;
}

const KEYWORDS = new Set([
  'abstract', 'async', 'await', 'boolean', 'break', 'case', 'catch', 'class',
  'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if',
  'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'new',
  'null', 'of', 'package', 'private', 'protected', 'public', 'return',
  'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type',
  'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield',
  'def', 'elif', 'except', 'lambda', 'pass', 'raise', 'self', 'print',
  'fn', 'mut', 'pub', 'struct', 'impl', 'trait', 'use', 'mod', 'match',
]);

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    // Single-line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }
    if (line[i] === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }
    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== q) {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=+\-*/<>[\]{}!&|^~%?:]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d.xXa-fA-FeEn_]/.test(line[j])) j++;
      tokens.push({ type: 'number', value: line.slice(i, j) });
      i = j;
      continue;
    }
    // Words (potential keywords)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({
        type: KEYWORDS.has(word) ? 'keyword' : 'plain',
        value: word,
      });
      i = j;
      continue;
    }
    // Plain
    tokens.push({ type: 'plain', value: line[i] });
    i++;
  }
  return tokens;
}

const tokenColorMap: Record<Token['type'], string> = {
  keyword: 'var(--ds-primary-300)',
  string: 'var(--ds-success-300)',
  comment: 'var(--ds-text-tertiary)',
  number: 'var(--ds-accent-300)',
  plain: 'var(--ds-text-primary)',
};

function HighlightedLine({ line }: { line: string }) {
  const tokens = useMemo(() => tokenize(line), [line]);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: tokenColorMap[t.type] }}>
          {t.value}
        </span>
      ))}
    </>
  );
}

/* ─── Component ─── */
export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  copyButton = true,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [code]);

  const lines = code.split('\n');
  // Width for line numbers gutter (min 2ch)
  const gutterWidth = String(lines.length).length + 1;

  return (
    <div
      className={`relative group rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'var(--ds-bg-elevated)',
        border: '1px solid var(--ds-border-default)',
        boxShadow: 'var(--ds-shadow-md)',
      }}
    >
      {/* Header bar */}
      {(language || copyButton) && (
        <div
          className="flex items-center justify-between px-4 h-9 text-xs border-b"
          style={{
            background: 'var(--ds-bg-glass)',
            borderColor: 'var(--ds-border-default)',
            color: 'var(--ds-text-tertiary)',
          }}
        >
          <span className="font-medium uppercase tracking-wider">
            {language || ''}
          </span>
          {copyButton && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-xs"
              style={{ color: 'var(--ds-text-secondary)' }}
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Code area */}
      <div className="overflow-x-auto">
        <pre
          className="p-4 text-sm leading-6 m-0"
          style={{
            fontFamily: 'var(--ds-font-mono)',
            tabSize: 2,
          }}
        >
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span
                    className="select-none text-right shrink-0 pr-4"
                    style={{
                      width: `${gutterWidth}ch`,
                      color: 'var(--ds-text-tertiary)',
                    }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="flex-1">
                  <HighlightedLine line={line} />
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default CodeBlock;
