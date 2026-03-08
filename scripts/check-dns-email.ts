#!/usr/bin/env tsx
/**
 * DNS Email Record Checker
 * Usage: pnpm tsx scripts/check-dns-email.ts [domain]
 *
 * Checks SPF, DKIM, DMARC, and MX records for the given domain.
 * Defaults to PLATFORM_ROOT_DOMAIN env var if no argument provided.
 */

import { config } from 'dotenv';
import { checkEmailDnsRecords, type DnsCheckResult } from '../lib/dns-health';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const domain = process.argv[2] || process.env.PLATFORM_ROOT_DOMAIN;

if (!domain) {
  console.error('Usage: tsx scripts/check-dns-email.ts <domain>');
  console.error('  or set PLATFORM_ROOT_DOMAIN in .env');
  process.exit(1);
}

// Strip port if present (e.g., lvh.me:3000 → lvh.me)
const cleanDomain = domain.split(':')[0];

function statusIcon(result: DnsCheckResult): string {
  switch (result.status) {
    case 'pass': return '\x1b[32m PASS \x1b[0m';
    case 'warn': return '\x1b[33m WARN \x1b[0m';
    case 'fail': return '\x1b[31m FAIL \x1b[0m';
  }
}

async function main() {
  console.log(`\nChecking email DNS records for: ${cleanDomain}\n`);
  console.log('─'.repeat(60));

  const results = await checkEmailDnsRecords(cleanDomain);

  const checks = [
    { name: 'SPF', result: results.spf, desc: 'Sender Policy Framework' },
    { name: 'DKIM', result: results.dkim, desc: 'DomainKeys Identified Mail' },
    { name: 'DMARC', result: results.dmarc, desc: 'Domain-based Message Auth' },
    { name: 'MX', result: results.mx, desc: 'Mail Exchange' },
  ];

  for (const check of checks) {
    console.log(`${statusIcon(check.result)}  ${check.name} (${check.desc})`);
    if (check.result.record) {
      console.log(`        ${check.result.record}`);
    }
    if (check.result.error) {
      console.log(`        ${check.result.error}`);
    }
    console.log();
  }

  console.log('─'.repeat(60));
  const overallIcon = results.overallStatus === 'pass' ? '\x1b[32m' :
    results.overallStatus === 'warn' ? '\x1b[33m' : '\x1b[31m';
  console.log(`${overallIcon}Overall: ${results.overallStatus.toUpperCase()}\x1b[0m\n`);

  process.exit(results.overallStatus === 'fail' ? 1 : 0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
