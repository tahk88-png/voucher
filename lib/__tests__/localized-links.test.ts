import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

// Only the campaign routes exist under /[locale]. The locale-aware Link from
// "@/routing" prefixes every href with the visitor's locale, so pointing it at
// /m/*, /v/*, /hub or /login sent /et/... visitors to a 404 (the "Buy now"
// button on /et/campaigns/<id> was broken this way). Those links must use
// next/link.
const UNLOCALIZED = /<Link\b[^>]*href=\{?["'`]\/(m|v|hub|login|register|app|merchant|gifts)\b/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : full.endsWith('.tsx') ? [full] : [];
  });
}

describe('links from localized pages', () => {
  it('never send unlocalized routes through the locale-aware Link', () => {
    const offenders: string[] = [];
    for (const file of files(path.resolve(__dirname, '../../app/[locale]'))) {
      const source = readFileSync(file, 'utf8');
      if (!/from ["']@\/routing["']/.test(source)) continue;
      source.split('\n').forEach((line, i) => {
        if (UNLOCALIZED.test(line)) offenders.push(`${path.relative(process.cwd(), file)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
