/**
 * Provider factory + failover logic.
 *
 * Resolves the primary provider from DB config (EmailProviderConfig),
 * falls back to env-based detection if no DB config exists.
 */

import { prisma } from '@/lib/prisma';
import type { EmailProvider } from './types';
import { ResendProvider } from './resend-provider';
import { SmtpProvider } from './smtp-provider';

const providerCache = new Map<string, EmailProvider>();

export function createEmailProvider(type: 'resend' | 'smtp'): EmailProvider {
  const cached = providerCache.get(type);
  if (cached) return cached;

  let provider: EmailProvider;
  switch (type) {
    case 'resend':
      provider = new ResendProvider();
      break;
    case 'smtp':
      provider = new SmtpProvider();
      break;
    default:
      throw new Error(`Unknown email provider: ${type}`);
  }

  providerCache.set(type, provider);
  return provider;
}

/**
 * Get the primary email provider.
 * Checks DB config first, falls back to env-based detection.
 */
export async function getPrimaryProvider(): Promise<EmailProvider> {
  try {
    const dbConfig = await prisma.emailProviderConfig.findFirst({
      where: { isActive: true, isPrimary: true },
      orderBy: { priority: 'asc' },
    });

    if (dbConfig) {
      return createEmailProvider(dbConfig.provider);
    }
  } catch {
    // DB not available — fall through to env detection
  }

  // Env-based fallback
  if (process.env.RESEND_API_KEY) {
    return createEmailProvider('resend');
  }
  if (process.env.SMTP_HOST) {
    return createEmailProvider('smtp');
  }

  throw new Error('No email provider configured');
}

/**
 * Get fallback provider (next active provider by priority).
 * Returns null if no fallback available.
 */
export async function getFallbackProvider(): Promise<EmailProvider | null> {
  try {
    const configs = await prisma.emailProviderConfig.findMany({
      where: { isActive: true, isPrimary: false },
      orderBy: { priority: 'asc' },
      take: 1,
    });

    if (configs.length > 0) {
      return createEmailProvider(configs[0].provider);
    }
  } catch {
    // DB not available
  }

  // Env-based fallback: if primary is Resend, try SMTP
  if (process.env.RESEND_API_KEY && process.env.SMTP_HOST) {
    return createEmailProvider('smtp');
  }

  return null;
}

/**
 * Send with automatic failover.
 * Tries primary, on failure tries fallback.
 */
export async function sendWithFailover(
  params: import('./types').EmailSendParams
): Promise<import('./types').EmailSendResult> {
  const primary = await getPrimaryProvider();

  try {
    return await primary.send(params);
  } catch (primaryError) {
    const fallback = await getFallbackProvider();
    if (!fallback) throw primaryError;

    try {
      return await fallback.send(params);
    } catch {
      // Fallback also failed — throw original error
      throw primaryError;
    }
  }
}
