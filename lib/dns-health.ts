/**
 * DNS email record verification.
 *
 * Checks SPF, DKIM, DMARC, and MX records for a domain using
 * the built-in dns/promises module (same as merchant domain verification).
 */

import dns from 'dns/promises';

export interface DnsCheckResult {
  status: 'pass' | 'fail' | 'warn';
  record?: string;
  error?: string;
}

export interface EmailDnsResults {
  domain: string;
  spf: DnsCheckResult;
  dkim: DnsCheckResult;
  dmarc: DnsCheckResult;
  mx: DnsCheckResult;
  overallStatus: 'pass' | 'warn' | 'fail';
}

const DKIM_SELECTORS = ['resend', 'google', 'default', 'selector1', 'selector2', 'k1'];

export async function checkSpf(domain: string): Promise<DnsCheckResult> {
  try {
    const records = await dns.resolveTxt(domain);
    const flat = records.map((r) => r.join(''));
    const spfRecord = flat.find((r) => r.startsWith('v=spf1'));
    if (spfRecord) {
      return { status: 'pass', record: spfRecord };
    }
    return { status: 'fail', error: 'No SPF record found' };
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return { status: 'fail', error: 'No TXT records found' };
    }
    return { status: 'fail', error: err.message };
  }
}

export async function checkDkim(domain: string, selectors: string[] = DKIM_SELECTORS): Promise<DnsCheckResult> {
  for (const selector of selectors) {
    try {
      const records = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
      const flat = records.map((r) => r.join(''));
      const dkimRecord = flat.find((r) => r.includes('v=DKIM1') || r.includes('p='));
      if (dkimRecord) {
        return { status: 'pass', record: `${selector}._domainkey: ${dkimRecord.substring(0, 80)}...` };
      }
    } catch {
      // Try next selector
    }
  }
  return { status: 'warn', error: `No DKIM record found (checked selectors: ${selectors.join(', ')})` };
}

export async function checkDmarc(domain: string): Promise<DnsCheckResult> {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const flat = records.map((r) => r.join(''));
    const dmarcRecord = flat.find((r) => r.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      return { status: 'pass', record: dmarcRecord };
    }
    return { status: 'warn', error: 'No DMARC record found' };
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return { status: 'warn', error: 'No DMARC TXT record found' };
    }
    return { status: 'warn', error: err.message };
  }
}

export async function checkMx(domain: string): Promise<DnsCheckResult> {
  try {
    const records = await dns.resolveMx(domain);
    if (records.length > 0) {
      const top = records.sort((a, b) => a.priority - b.priority)[0];
      return { status: 'pass', record: `${top.priority} ${top.exchange}` };
    }
    return { status: 'warn', error: 'No MX records found' };
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return { status: 'warn', error: 'No MX records found' };
    }
    return { status: 'fail', error: err.message };
  }
}

export async function checkEmailDnsRecords(domain: string): Promise<EmailDnsResults> {
  const [spf, dkim, dmarc, mx] = await Promise.all([
    checkSpf(domain),
    checkDkim(domain),
    checkDmarc(domain),
    checkMx(domain),
  ]);

  const checks = [spf, dkim, dmarc, mx];
  let overallStatus: 'pass' | 'warn' | 'fail' = 'pass';
  if (checks.some((c) => c.status === 'fail')) overallStatus = 'fail';
  else if (checks.some((c) => c.status === 'warn')) overallStatus = 'warn';

  return { domain, spf, dkim, dmarc, mx, overallStatus };
}
